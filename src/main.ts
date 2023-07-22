import plugin from "../plugin.json";
const selectionMenu = acode.require("selectionMenu");
const appSettings = acode.require("settings");
const toast = acode.require("toast");

// Interface for Comment Syntax ( Single )
interface CommentSyntax {
  [key: string]: string;
}

// Interface for Comment Syntax ( Double )
interface DoubleLineCommentSyntax {
  first: string;
  last: string;
}

type CommentTypes = CommentSyntax | DoubleLineCommentSyntax;

type DoubleOrString = string | DoubleLineCommentSyntax;

// Supported languages
const supportedLang = [
  "c", // C
  "cc", // C++
  "cljs", // Clojure
  "cpp", // C++
  "cs", // C#
  "css", // Css
  "cxx", // C++
  "dart", // Dart
  "ejs", // Embeded Javascript
  "go", // Golang
  "h", // C header
  "haml", // Haml
  "hpp", // C++ header
  "html", // Html
  "hs", // Haskel
  "hxx", // C++ header
  "inl", // C++ inline
  "ipp", // C++ implementation
  "java", // Java
  "js", // Javascript
  "json", // Json
  "jsx", // Jsx
  "kt", // Kotlin
  "lua", // Lua
  "mjs", // Javascript
  "php", // PHP
  "pl", // Perl
  "py", // Python
  "rb", // Ruby
  "rs", // Rust
  "sh", // Shell
  "swift", // Swift
  "sql", // SQL
  "sqlite", // SQLite
  "ts", // Typescript
  "tsx", // Tsx
];

// Supported templating engines
const supportedTempl = [
  "blade", // Laravel Blade (blade.php)
  "hbs", // HandleBars
  "liquid", // Liquid
  "mako", // Mako
  "mst", // Mustache
  "mustache", // Mustache
  "pug", // Pug
  "tpl", // Smarty
  "twig", // Twig
  "vm", // Velocity
];

// Supported Files
const supportedFiles = [
  "env",
  "gitignore",
  "Makefile", // Makefile
  "toml", // Toml
  "xml", // Xml
  "yml", // Yaml
  "yaml", // Yaml
];
// Comment syntax for single-line comments
const cmtSyntax: CommentSyntax = {
  c: "// ",
  cc: "// ",
  cljs: "// ",
  cpp: "// ",
  cs: "// ",
  cxx: "// ",
  dart: "// ",
  ejs: "// ",
  env: "# ",
  gitignore: "# ",
  go: "// ",
  h: "// ",
  haml: "# ",
  hpp: "// ",
  hxx: "// ",
  hs: "-- ",
  inl: "// ",
  ipp: "// ",
  java: "// ",
  js: "// ",
  json: "// ",
  jsx: "// ",
  kt: "// ",
  lua: "-- ",
  Makefile: "# ",
  mjs: "// ",
  php: "// ",
  pl: "# ",
  pug: "// ",
  py: "# ",
  rb: "# ",
  rs: "// ",
  sh: "# ",
  sql: "-- ",
  sqlite: "-- ",
  swift: "// ",
  toml: "# ",
  ts: "// ",
  tsx: "// ",
  vm: "## ",
  yml: "# ",
  yaml: "# ",
};

// Comment syntax for double-line comments
const cmtSyntaxDouble: {
  [key: string]: DoubleLineCommentSyntax;
} = {
  html: { first: "<!-- ", last: " -->" },
  twig: { first: "{# ", last: " #}" },
  blade: { first: "{{-- ", last: " --}}" },
  hbs: { first: "{{!-- ", last: " --}}" },
  css: { first: "/* ", last: " */" },
  mako: { first: "<%# ", last: " %>" },
  mst: { first: "<!-- ", last: " -->" },
  mustache: { first: "<!-- ", last: " -->" },
  tpl: { first: "{* ", last: " *}" },
  xml: { first: "<!-- ", last: " -->" },
  liquid: { first: "{# ", last: " #}" },
};

class CodeCommenter {
  // multi comment for html ,css, xml is true ( enabled by default )
  public multiComment: boolean = true;
  // file mode for files like .env and .gitignore ( enabled by default )
  public files: boolean = true;
  // templating engine mode (enabled by default)
  public templatingEngine: boolean = true;
  // Available extensions
  private extensions: string[] = [];
  // Base Url
  public baseUrl: string | undefined;
  // register the settings
  constructor() {
    if (!appSettings.value[plugin.id]) {
      appSettings.value[plugin.id] = {
        multiComment: this.multiComment,
        fileMode: this.files,
        templEngineMode: this.templatingEngine,
      };
      appSettings.update(false);
    }
  }
  public async init(): Promise<void> {
    // Add the comment action to the selection menu
    selectionMenu.add(this.action.bind(this), "//", "all");
  }
  // Plugin Action
  public async action() {
    const { editor, activeFile } = editorManager;
    this.loadExtensions();
    // extension name
    let extname = this.getExt(activeFile.name);

    if (this.extNotSupported(extname)) {
      // Show a toast message if the file extension is not supported
      toast("file not supported", 3000);
      return;
    }

    let selectionRange = editor.getSelectionRange();
    // selected text by user
    let selectedText = editor.getSelectedText();
    // get the syntax for the file extension
    let cmt: DoubleOrString = cmtSyntax[extname] || cmtSyntaxDouble[extname];

    //if the extension is html or css we do multi line comment instead of single line
    if (this.settings.multiComment && this.multiSupport(extname)) {
      if (selectedText.startsWith(cmt["first"], 0)) {
        let modifiedText: string = selectedText.replace(cmt["first"], "");
        modifiedText = modifiedText.replace(cmt["last"], "");
        // Replace the selected text with the commented text
        editor.getSession().replace(selectionRange, modifiedText);
        // Reset extension
        this.extensions = [];
        // Show a success toast message
        toast("Success", 2000);
        return;
      }
      let modifiedText: string = cmt["first"] + selectedText + cmt["last"];
      // Replace the selected text with the commented text
      editor.getSession().replace(selectionRange, modifiedText);
      // Reset extension
      this.extensions = [];
      // Show a success toast message
      toast("Success", 2000);
      return;
    }
    let lines: string[] = selectedText.split("\n");
    let modifiedText: string[] = lines.map((line) => {
      if (typeof cmt === "object") {
        return this.doubleCommentParser(cmt, line);
      } else {
        return this.singleCommentParser(cmt, line);
      }
    });
    let newText = modifiedText.join("\n");

    // Replace the selected text with the commented text
    editor.getSession().replace(selectionRange, newText);
    // Reset the extensions
    this.extensions = [];
    // Show a success toast message
    toast("Success", 2000);
  }

  // Get the file extension from the filename
  private getExt(filename: string): string {
    const parts = filename.split(".");
    if (parts.length >= 2) {
      const extension = parts.pop();
      if (extension === "php" && parts[parts.length - 1] === "blade") {
        return "blade";
      }
      return extension;
    }
    return "";
  }

  // Check if the file extension is not supported
  private extNotSupported(ext: string): boolean {
    return !this.extensions.includes(ext);
  }

  // Parse double-line comments
  private doubleCommentParser(cmt: CommentTypes, line: string): string {
    if (line.startsWith(cmt["first"], 0)) {
      let parsed = line.replace(cmt["first"], "");
      return parsed.replace(cmt["last"], "");
    }
    return cmt["first"] + line + cmt["last"];
  }

  // Parse single-line comments
  private singleCommentParser(cmt: string, line: string): string {
    if (line.startsWith(cmt, 0)) {
      return line.replace(cmt, "");
    }
    return cmt + line;
  }
  // get settings list
  public get settingsList() {
    return {
      list: [
        {
          key: "multiComment",
          text: "Multi Comment for Html | Css | Xml",
          checkbox: this.settings.multiComment,
          info: "If you enabled this, then the comment of Html / Css / Xml will be multi commented else single commented",
        },
        {
          key: "fileMode",
          text: "Comment support for files",
          checkbox: this.settings.fileMode,
          info: "Enable comment support for files, ex: files like .env,.gitignore etc",
        },
        {
          key: "templEngineMode",
          text: "Comment support for templating engines",
          info: "Enable comment support for templating engine's like blade , pug etc..",
          checkbox: this.settings.templEngineMode,
        },
      ],
      cb: (key: string, value: boolean) => {
        this.settings[key] = value;
        appSettings.update(true);
      },
    };
  }
  // get plugin settings value from settings.json
  public get settings() {
    return appSettings.value[plugin.id];
  }

  public async destroy(): Promise<void> {
    // Clean up or perform any necessary actions when the plugin is destroyed
  }
  // load supported extesions from users settings
  private loadExtensions(): void {
    this.extensions.push(...supportedLang);
    if (this.settings.fileMode) {
      this.extensions.push(...supportedFiles);
    }
    if (this.settings.templEngineMode) {
      this.extensions.push(...supportedTempl);
    }
  }
  // check the extension is either html/css or xml
  private multiSupport(ext: string): boolean {
    return ext == "html" || ext == "css" || ext == "xml";
  }
}

if (window.acode) {
  const acodePlugin = new CodeCommenter();

  acode.setPluginInit(
    plugin.id,
    async (
      baseUrl: string,
      $page: WCPage,
      { cacheFileUrl, cacheFile }: any
    ) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      await acodePlugin.init();
    },
    acodePlugin.settingsList
  );

  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
