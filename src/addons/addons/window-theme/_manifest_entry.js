const manifest = {
  "editorOnly": true,
  "noTranslations": true,
  "name": "Window Theme",
  "description": "Switch between different window styles: MistWarp (default), macOS, or Windows 10.",
  "credits": [
    {
      "name": "Mistium",
      "url": "https://mistium.com"
    }
  ],
  "dynamicDisable": true,
  "userstyles": [
    {
      "url": "macos.css",
      "if": {
        "settings": {
          "window-theme": "macos"
        }
      }
    },
    {
      "url": "windows10.css",
      "if": {
        "settings": {
          "window-theme": "windows10"
        }
      }
    }
  ],
  "settings": [
    {
      "dynamic": true,
      "name": "Window Theme",
      "id": "window-theme",
      "type": "select",
      "potentialValues": [
        {
          "id": "mistwarp",
          "name": "MistWarp (Default)"
        },
        {
          "id": "macos",
          "name": "macOS Style"
        },
        {
          "id": "windows10",
          "name": "Windows 10 Style"
        }
      ],
      "default": "mistwarp"
    }
  ],
  "tags": ["theme", "ui"],
  "enabledByDefault": false
};
export default manifest;