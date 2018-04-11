const GoldenLayout = require('../dist/goldenlayout');

describe('It creates and extends config segments correctly', () => {
  test("doesn't change the default config when calling extend", () => {
    const createConfig = GoldenLayout.prototype._createConfig;

    expect(createConfig({}).dimensions.borderWidth).toBe(5);

    const myConfig = createConfig({
      dimensions: {
        borderWidth: 10,
      },
    });

    expect(myConfig).not.toEqual(createConfig({}));
    expect(createConfig({}).dimensions.borderWidth).toBe(5);
    expect(myConfig.dimensions.borderWidth).toBe(10);
  });
});
