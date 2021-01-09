import { App } from './app';

// Run with URL: http://localhost:3000/api-test/dist/

declare global {
    interface Window {
        goldenLayoutApiTestApp: App;
    }
}

if (document.readyState !== "loading") run();
// in case the document is already rendered
else document.addEventListener("DOMContentLoaded", run, { passive: true });

function run() {
    const app = new App();
    window.goldenLayoutApiTestApp = app;
    app.start();
}
