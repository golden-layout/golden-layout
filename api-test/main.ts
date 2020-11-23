import "../src/less/goldenlayout-base.less";
import "../src/less/themes/goldenlayout-dark-theme.less";
import { App } from './app';
import "./test.less";

// Run with URL: http://localhost:3000/api-test/dist/

declare global {
    interface Window {
        golderLayoutApiTestApp: App;
    }
}

if (document.readyState !== "loading") run();
// in case the document is already rendered
else document.addEventListener("DOMContentLoaded", run);

function run() {
    const app = new App();
    window.golderLayoutApiTestApp = app;
    app.start();
}
