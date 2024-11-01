import { expect, test as testBase } from '@playwright/test';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import v8toIstanbul from 'v8-to-istanbul';

// Default directory that nyc command refers to.
const istanbulCLIOutput = path.join(process.cwd(), '.nyc_output');
if (!fs.existsSync(istanbulCLIOutput)) {
    fs.mkdirSync(istanbulCLIOutput);
}

// Random part of file name for each test case
const generateUUID = () => crypto.randomBytes(16).toString('hex');

// Extend playwright's test function
const test = testBase.extend<{ autoTestFixture: any }>({
    autoTestFixture: [
        async ({ page, request }, use) => {
            // V8カバレッジデータの取得はChromium実行時のみ行う
            const isChromium = test.info().project.name === 'chromium';
            if (isChromium) {
                await page.coverage.startJSCoverage({
                    resetOnNavigation: false,
                });
            }

            // test実行
            await use();

            // test完了後カバレッジデータを.nyc_output/へダンプ
            if (isChromium) {
                // main.jsのV8カバレッジデータ取得
                const coverages = await page.coverage.stopJSCoverage();

                for (const entry of coverages) {
                    if (!entry.url.endsWith('main.js')) {
                        continue;
                    }

                    console.log('entry.url', entry.url);

                    // ソースマップ取得
                    const sourceMapPms = await request.get(entry.url + '.map');
                    const sourceMap = await sourceMapPms.json();
                    // sourceMap.sourceRoot = './';

                    // Typescript変換しつつ、カバレッジをV8形式からistanbul形式へ変換
                    const converter = v8toIstanbul('', 0, {
                        source: entry.source,
                        sourceMap: { sourcemap: sourceMap },
                    });
                    await converter.load();
                    converter.applyCoverage(entry.functions);

                    // .nyc_output/へistanbul形式カバレッジファイルを出力
                    const coverageJson = JSON.stringify(converter.toIstanbul());
                    fs.writeFileSync(
                        path.join(
                            istanbulCLIOutput,
                            `playwright_coverage_${generateUUID()}.json`
                        ),
                        coverageJson
                    );
                }
            }
        },
        {
            scope: 'test',
            auto: true,
        },
    ],
});
export { expect, test };
