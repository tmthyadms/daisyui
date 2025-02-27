const colorNames = require("./colorNames")
const themeDefaults = require("./themeDefaults")

const { toGamut, interpolate, wcagContrast } = require("culori")

module.exports = {
  isDark: (color) => {
    if (wcagContrast(color, "black") < wcagContrast(color, "white")) {
      return true
    }
    return false
  },

  colorObjToString: function (input) {
    const cut = (number) => {
      if (!number) {
        return 0
      }
      return +number.toFixed(6)
    }
    const { l, c, h } = input
    return `${cut(l)} ${cut(c)} ${cut(h)}`
  },

  generateForegroundColorFrom: function (input, percentage = 0.8) {
    const result = interpolate([input, this.isDark(input) ? "white" : "black"], "oklch")(percentage)
    return this.colorObjToString(result)
  },

  generateDarkenColorFrom: function (input, percentage = 0.07) {
    const result = interpolate([input, "black"], "oklch")(percentage)
    return this.colorObjToString(result)
  },

  convertColorFormat: function (input) {
    if (typeof input !== "object" || input === null) {
      return input
    }

    const resultObj = {}

    Object.entries(input).forEach(([rule, value]) => {
      if (colorNames.hasOwnProperty(rule)) {
        const colorObj = toGamut("oklch")(value)
        resultObj[colorNames[rule]] = this.colorObjToString(colorObj)
      } else {
        resultObj[rule] = value
      }

      // auto generate base colors
      if (!Object.hasOwn(input, "base-100")) {
        resultObj["--b1"] = "100 0 0"
      }
      if (!Object.hasOwn(input, "base-200")) {
        resultObj["--b2"] = this.generateDarkenColorFrom(input["base-100"], 0.07)
      }
      if (!Object.hasOwn(input, "base-300")) {
        if (Object.hasOwn(input, "base-200")) {
          resultObj["--b3"] = this.generateDarkenColorFrom(input["base-200"], 0.07)
        } else {
          resultObj["--b3"] = this.generateDarkenColorFrom(input["base-100"], 0.14)
        }
      }

      // auto generate state colors

      if (!Object.hasOwn(input, "info")) {
        resultObj["--in"] = "0.7206 0.191 231.6"
      }
      if (!Object.hasOwn(input, "success")) {
        resultObj["--su"] = "0.7441 0.213 164.75"
      }
      if (!Object.hasOwn(input, "warning")) {
        resultObj["--wa"] = "0.8471 0.199 83.87"
      }
      if (!Object.hasOwn(input, "error")) {
        resultObj["--er"] = "0.7176 0.221 22.18"
      }

      // auto generate content colors
      if (!Object.hasOwn(input, "base-content")) {
        resultObj["--bc"] = this.generateForegroundColorFrom(input["base-100"], 0.8)
      }
      if (!Object.hasOwn(input, "primary-content")) {
        resultObj["--pc"] = this.generateForegroundColorFrom(input["primary"], 0.8)
      }
      if (!Object.hasOwn(input, "secondary-content")) {
        resultObj["--sc"] = this.generateForegroundColorFrom(input["secondary"], 0.8)
      }
      if (!Object.hasOwn(input, "accent-content")) {
        resultObj["--ac"] = this.generateForegroundColorFrom(input["accent"], 0.8)
      }
      if (!Object.hasOwn(input, "neutral-content")) {
        resultObj["--nc"] = this.generateForegroundColorFrom(input["neutral"], 0.8)
      }
      if (!Object.hasOwn(input, "info-content")) {
        if (Object.hasOwn(input, "info")) {
          resultObj["--inc"] = this.generateForegroundColorFrom(input["info"], 0.8)
        } else {
          resultObj["--inc"] = "0 0 0"
        }
      }
      if (!Object.hasOwn(input, "success-content")) {
        if (Object.hasOwn(input, "success")) {
          resultObj["--suc"] = this.generateForegroundColorFrom(input["success"], 0.8)
        } else {
          resultObj["--suc"] = "0 0 0"
        }
      }
      if (!Object.hasOwn(input, "warning-content")) {
        if (Object.hasOwn(input, "warning")) {
          resultObj["--wac"] = this.generateForegroundColorFrom(input["warning"], 0.8)
        } else {
          resultObj["--wac"] = "0 0 0"
        }
      }
      if (!Object.hasOwn(input, "error-content")) {
        if (Object.hasOwn(input, "error")) {
          resultObj["--erc"] = this.generateForegroundColorFrom(input["error"], 0.8)
        } else {
          resultObj["--erc"] = "0 0 0"
        }
      }

      // add css variables if not exist
      Object.entries(themeDefaults.variables).forEach((item) => {
        const [variable, value] = item
        if (!Object.hasOwn(input, variable)) {
          resultObj[variable] = value
        }
      })

      // add other custom styles
      if (!colorNames.hasOwnProperty(rule)) {
        resultObj[rule] = value
      }
    })

    return resultObj
  },

  injectThemes: function (addBase, config, themes) {
    const includedThemesObj = {}
    // add default themes
    const themeRoot = config("daisyui.themeRoot") ?? ":root"
    Object.entries(themes).forEach(([theme, value]) => {
      includedThemesObj[theme] = this.convertColorFormat(value)
    })

    // add custom themes
    if (Array.isArray(config("daisyui.themes"))) {
      config("daisyui.themes").forEach((item) => {
        if (typeof item === "object" && item !== null) {
          Object.entries(item).forEach(([customThemeName, customThemevalue]) => {
            includedThemesObj[customThemeName] = this.convertColorFormat(customThemevalue)
          })
        }
      })
    }

    let themeOrder = []
    if (Array.isArray(config("daisyui.themes"))) {
      config("daisyui.themes").forEach((theme) => {
        if (typeof theme === "object" && theme !== null) {
          Object.keys(theme).forEach((customThemeName) => {
            themeOrder.push(customThemeName)
          })
        } else if (Object.hasOwn(includedThemesObj, theme)) {
          themeOrder.push(theme)
        }
      })
    } else if (config("daisyui.themes") === true) {
      themeOrder = themeDefaults.themeOrder
    } else {
      themeOrder = ["light", "dark"]
    }

    // inject themes in order
    const themesToInject = {}
    themeOrder.forEach((themeName, index) => {
      if (index === 0) {
        // first theme as root
        themesToInject[themeRoot] = includedThemesObj[themeName]
      } else if (index === 1) {
        // auto dark
        if (config("daisyui.darkTheme")) {
          if (
            themeOrder[0] !== config("daisyui.darkTheme") &&
            themeOrder.includes(config("daisyui.darkTheme"))
          ) {
            themesToInject["@media (prefers-color-scheme: dark)"] = {
              [themeRoot]: includedThemesObj[`${config("daisyui.darkTheme")}`],
            }
          }
        } else if (config("daisyui.darkTheme") === false) {
          // disables prefers-color-scheme: dark
        } else {
          if (themeOrder[0] !== "dark" && themeOrder.includes("dark")) {
            themesToInject["@media (prefers-color-scheme: dark)"] = {
              [themeRoot]: includedThemesObj["dark"],
            }
          }
        }
        // theme 0 with name
        themesToInject[
          "[data-theme=" +
            themeOrder[0] +
            "], " +
            themeRoot +
            ":has(input.theme-controller[value=" +
            themeOrder[0] +
            "]:checked)"
        ] = includedThemesObj[themeOrder[0]]
        // theme 1 with name
        themesToInject[
          "[data-theme=" +
            themeOrder[1] +
            "], " +
            themeRoot +
            ":has(input.theme-controller[value=" +
            themeOrder[1] +
            "]:checked)"
        ] = includedThemesObj[themeOrder[1]]
      } else {
        themesToInject[
          "[data-theme=" +
            themeName +
            "], " +
            themeRoot +
            ":has(input.theme-controller[value=" +
            themeName +
            "]:checked)"
        ] = includedThemesObj[themeName]
      }
    })

    addBase(themesToInject)

    return {
      includedThemesObj,
      themeOrder,
    }
  },
}
