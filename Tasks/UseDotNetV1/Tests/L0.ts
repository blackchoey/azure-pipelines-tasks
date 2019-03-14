const assert = require('assert');
const ttm = require('azure-pipelines-task-lib/mock-test');
const os = require('os');
const path = require('path');

function setResponseFile(name) {
    process.env['MOCK_RESPONSES'] = path.join(__dirname, name);
}

function runValidations(validator: () => void, tr, done) {
    try {
        validator();
        done();
    }
    catch (error) {
        console.log("STDERR", tr.stderr);
        console.log("STDOUT", tr.stdout);
        done(error);
    }
}

describe('UseDotNet', function() {
    this.timeout(30000);
    before((done) => {
        done();
    });
    after(function() {
    });

    if(os.type().match(/^Win/)) {
        it("[windows]should succeed if sdk installed successfully", (done) => {
            process.env["__package_type__"] = "sdk";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("loc_mock_ToolToInstall sdk 1.0.4") > -1, "should print to-be-installed info");
                assert(tr.stdout.indexOf("Checking local tool for dncs and version 1.0.4") > -1, "should check for local cached tool");
                assert(tr.stdout.indexOf("loc_mock_InstallingAfresh") > -1, "should install fresh if cache miss");
                assert(tr.stdout.indexOf("Downloading tool from https://primary-url") > -1, "should download from correct url");
                assert(tr.stdout.indexOf("Extracting zip archive from C:\\") && tr.stdout.indexOf("\\someArchive.zip") > -1, "Should extract downloaded archive corectly");
                assert(tr.stdout.indexOf("Caching dir C:\\") && tr.stdout.indexOf("someDir for tool dncs version 1.0.4") > -1, "should cache correctly");
                assert(tr.stdout.indexOf("loc_mock_SuccessfullyInstalled sdk 1.0.4") > -1, "should print installed tool info");
                assert(tr.stdout.indexOf("prepending path: C:\\agent\\_tools\\cacheDir") > -1, "should pre-prend to PATH");
            }, tr, done);
        });

        it("[windows]should succeed if runtime installed successfully", (done) => {
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__package_type__"];

            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("loc_mock_ToolToInstall runtime 1.0.4") > -1, "should print to-be-installed info");
                assert(tr.stdout.indexOf("Checking local tool for dncr and version 1.0.4") > -1, "should check for local cached tool");
                assert(tr.stdout.indexOf("loc_mock_InstallingAfresh") > -1, "should install fresh if cache miss");
                assert(tr.stdout.indexOf("Downloading tool from https://primary-runtime-url") > -1, "should download from correct url");
                assert(tr.stdout.indexOf("Extracting zip archive from C:\\") && tr.stdout.indexOf("someArchive.zip") > -1, "Should extract downloaded archive corectly");
                assert(tr.stdout.indexOf("Caching dir C:\\") && tr.stdout.indexOf("someDir for tool dncr version 1.0.4") > -1, "should cache correctly");
                assert(tr.stdout.indexOf("loc_mock_SuccessfullyInstalled runtime 1.0.4") > -1, "should print installed tool info");
                assert(tr.stdout.indexOf("prepending path: C:\\agent\\_tools\\cacheDir") > -1, "should pre-prend to PATH");
            }, tr, done);
        });

        it("[windows]should not install again if cache hit", (done) => {
            process.env["__cache_hit__"] = "true";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__cache_hit__"];

            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("loc_mock_ToolToInstall sdk 1.0.4") > -1, "should print to-be-installed info");
                assert(tr.stdout.indexOf("Checking local tool for dncr and version 1.0.4") > -1, "should check for local cached tool");
                assert(tr.stdout.indexOf("loc_mock_InstallingAfresh") == -1, "should not install fresh");
                assert(tr.stdout.indexOf("loc_mock_GettingDownloadUrls") == -1, "should not download");
                assert(tr.stdout.indexOf("loc_mock_UsingCachedTool") > -1, "should print that cached dir is being used");
                assert(tr.stdout.indexOf("Caching dir C:\\agent\\_temp\\someDir for tool dncr version 1.0.4") == -1, "should not update cache again");
                assert(tr.stdout.indexOf("prepending path: C:\\agent\\_tools\\oldCacheDir") > -1, "should pre-prend to PATH");
            }, tr, done);
        });


        it("[windows]should download using legacy url if primary url does not work", (done) => {
            process.env["__primary_url_failed__"] = "true";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__primary_url_failed__"];

            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("404 not found https://primary-url") > -1, "should print primary url failure error")
                assert(tr.stdout.indexOf("Downloading tool from https://legacy-url") > -1, "should download from legacy url");
            }, tr, done);
        });

        it("[windows]should set proxy if proxy input is true", (done) => {
            process.env["__proxy__"] = "true";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__proxy__"];
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("Set proxy url") > -1, "should set proxy url");
                assert(tr.stdout.indexOf("Set proxy username") > -1, "should set proxy username");
                assert(tr.stdout.indexOf("Set proxy password") > -1, "should set proxy password");
            }, tr, done);
        });

        it("[windows]should set internal auth correctly", (done) => {
            process.env["__auth__"] = "myAuth";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__auth__"];
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("Set internal auth") > -1, "should set internal auth");
                assert(tr.stdout.indexOf("Set internal api key") > -1, "should set internal api key");
            }, tr, done);
        });

        it("[windows]should set external auth correctly", (done) => {
            process.env["__auth__"] = "myAuth";
            process.env["__nuGetFeedType__"] = "external";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__auth__"];
            delete process.env["__nuGetFeedType__"];
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("Set external auth") > -1, "should set external auth");
                assert(tr.stdout.indexOf("Set external api key") > -1, "should set external api key");
            }, tr, done);
        });

        it("[windows]should fail if explicit version is not used", (done) => {
            process.env["__implicit_version__"] = "true";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__implicit_version__"];

            runValidations(() => {
                assert(tr.failed, "Should have failed");
                assert(tr.stdout.indexOf("loc_mock_ImplicitVersionNotSupported") > -1, "should print error message");
            }, tr, done);
        });

        it("[windows]should fail if getting download script fails", (done) => {
            process.env["__get_dlurls_failed__"] = "true";
            let tp = path.join(__dirname, "InstallWindows.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__get_dlurls_failed__"];

            runValidations(() => {
                assert(tr.failed, "Should have failed");
                assert(tr.stdout.indexOf("loc_mock_getDownloadUrlsFailed install-script failed to get donwload urls") > -1, "should print error message");
                assert(tr.stdout.indexOf("loc_mock_DownloadingPrimaryUrl") == -1, "should not proceed with downloading");
            }, tr, done);
        });
    } else {
        it("[nix]should succeed if sdk installed successfully", (done) => {
            process.env["__package_type__"] = "sdk";
            let tp = path.join(__dirname, "InstallNix.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("loc_mock_ToolToInstall sdk 1.0.4") > -1, "should print to-be-installed info");
                assert(tr.stdout.indexOf("Checking local tool for dncs and version 1.0.4") > -1, "should check for local cached tool");
                assert(tr.stdout.indexOf("loc_mock_InstallingAfresh") > -1, "should install fresh if cache miss");
                assert(tr.stdout.indexOf("Changing attribute for file /somedir/currdir/externals/get-os-distro.sh to 777") > -1, "should iset executable attribute for install script");
                assert(tr.stdout.indexOf("Downloading tool from https://primary-url") > -1, "should download from correct url");
                assert(tr.stdout.indexOf("Extracting tar archive from ") > -1 && tr.stdout.indexOf("someArchive.tar") > -1, "Should extract downloaded archive corectly");
                assert(tr.stdout.indexOf("Caching dir ") > -1 && tr.stdout.indexOf(" for tool dncs version 1.0.4") > -1, "should cache correctly");
                assert(tr.stdout.indexOf("loc_mock_SuccessfullyInstalled sdk 1.0.4") > -1, "should print installed tool info");
                assert(tr.stdout.indexOf("prepending path: /agent/_tools/cacheDir") > -1, "should pre-prend to PATH");
            }, tr, done);
        });

        it("[nix]should succeed if runtime installed successfully", (done) => {
            let tp = path.join(__dirname, "InstallNix.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__package_type__"];

            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("loc_mock_ToolToInstall runtime 1.0.4") > -1, "should print to-be-installed info");
                assert(tr.stdout.indexOf("Checking local tool for dncr and version 1.0.4") > -1, "should check for local cached tool");
                assert(tr.stdout.indexOf("loc_mock_InstallingAfresh") > -1, "should install fresh if cache miss");
                assert(tr.stdout.indexOf("Downloading tool from https://primary-runtime-url") > -1, "should download from correct url");
                assert(tr.stdout.indexOf("Extracting tar archive from ") > -1 && tr.stdout.indexOf("someArchive.tar") > -1, "Should extract downloaded archive corectly");
                assert(tr.stdout.indexOf("Caching dir ") > -1 && tr.stdout.indexOf(" for tool dncr version 1.0.4") > -1, "should cache correctly");
                assert(tr.stdout.indexOf("loc_mock_SuccessfullyInstalled runtime 1.0.4") > -1, "should print installed tool info");
                assert(tr.stdout.indexOf("prepending path: /agent/_tools/cacheDir") > -1, "should pre-prend to PATH");
            }, tr, done);
        });

        it("[nix]should not install again if cache hit", (done) => {
            process.env["__cache_hit__"] = "true";
            let tp = path.join(__dirname, "InstallNix.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__cache_hit__"];

            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("loc_mock_ToolToInstall sdk 1.0.4") > -1, "should print to-be-installed info");
                assert(tr.stdout.indexOf("Checking local tool for dncr and version 1.0.4") > -1, "should check for local cached tool");
                assert(tr.stdout.indexOf("loc_mock_InstallingAfresh") == -1, "should not install fresh");
                assert(tr.stdout.indexOf("loc_mock_GettingDownloadUrls") == -1, "should not download");
                assert(tr.stdout.indexOf("loc_mock_UsingCachedTool") > -1, "should print that cached dir is being used");
                assert(tr.stdout.indexOf("Caching dir /agent/_temp/someDir for tool dncr version 1.0.4") == -1, "should not update cache again");
                assert(tr.stdout.indexOf("prepending path: /agent/_tools/oldCacheDir") > -1, "should pre-prend to PATH");
            }, tr, done);
        });

        it("[nix]Should download using DLC url if primary url does not work", (done) => {
            process.env["__primary_url_failed__"] = "true";
            let tp = path.join(__dirname, "InstallNix.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__primary_url_failed__"];

            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("404 not found https://primary-url") > -1, "should print primary url failure error")
                assert(tr.stdout.indexOf("Downloading tool from https://legacy-url") > -1, "should download from legacy url");
            }, tr, done);
        });

        it("[nix]should set proxy if proxy input is true", (done) => {
            process.env["__proxy__"] = "true";
            let tp = path.join(__dirname, "InstallNix.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__proxy__"];
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("Set proxy url") > -1, "should set proxy url");
                assert(tr.stdout.indexOf("Set proxy username") > -1, "should set proxy username");
                assert(tr.stdout.indexOf("Set proxy password") > -1, "should set proxy password");
            }, tr, done);
        });

        it("[nix]should set internal auth correctly", (done) => {
            process.env["__auth__"] = "myAuth";
            let tp = path.join(__dirname, "InstallNix.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__auth__"];
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("Set internal auth") > -1, "should set internal auth");
                assert(tr.stdout.indexOf("Set internal api key") > -1, "should set internal api key");
            }, tr, done);
        });

        it("[nix]should set external auth correctly", (done) => {
            process.env["__auth__"] = "myAuth";
            process.env["__nuGetFeedType__"] = "external";
            let tp = path.join(__dirname, "InstallNix.js");
            let tr = new ttm.MockTestRunner(tp);
            tr.run();
            delete process.env["__auth__"];
            delete process.env["__nuGetFeedType__"];
            runValidations(() => {
                assert(tr.succeeded, "Should have succeeded");
                assert(tr.stdout.indexOf("Set external auth") > -1, "should set external auth");
                assert(tr.stdout.indexOf("Set external api key") > -1, "should set external api key");
            }, tr, done);
        });
    }
});
