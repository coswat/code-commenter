import plugin from "../plugin.json";
const selectionMenu = acode.require("selectionMenu");

// Supported file extensions
const supportedExt = [
  "blade", // Laravel Blade (blade.php)
  "c", // C
  "cljs", // Clojure
  "cpp", // C++
  "cs", // C#
  "css", // Css
  "dart", // Dart
  "ejs", // Embeded Javascript
  "env",
  "gitignore",
  "go", // Golang
  "haml", // Haml
  "hbs", // HandleBars
  "html", // Html
  "hs", // Haskel
  "java", // Java
  "js", // Javascript
  "json", // Json
  "jsx", // Jsx
  "kt", // Kotlin
  "liquid", // Liquid
  "lua", // Lua
  "mako", // Mako
  "Makefile", // Makefile
  "mjs", // Javascript
  "mst", // Mustache
  "mustache", // Mustache
  "php", // PHP
  "pl", // Perl
  "pug", // Pug
  "py", // Python
  "rb", // Ruby
  "rs", // Rust
  "sh", // Shell
  "swift", // Swift
  "sql", // SQL
  "sqlite", // SQLite
  "toml", // Toml
  "tpl", // Smarty
  "ts", // Typescript
  "tsx", // Tsx
  "twig", // Twig
  "vm", // Velocity
  "xml", // Xml
  "yml", // Yaml
  "yaml", // Yaml
];

// Comment syntax for single-line comments
const cmtSyntax = {
  c: "// ",
  cljs: "// ",
  cpp: "// ",
  cs: "// ",
  dart: "// ",
  ejs: "// ",
  env: "# ",
  gitignore: "# ",
  go: "// ",
  haml: "# ",
  hs: "-- ",
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
const cmtSyntaxDouble = {
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
  async init() {
    // Add the comment action to the selection menu
    selectionMenu.add(this.action.bind(this), "//", "all");
  }

  async action() {
    const { editor, activeFile } = editorManager;
    // extension name
    let extname = this.getExt(activeFile.name);

    if (this.extNotSupported(extname)) {
      // Show a toast message if the file extension is not supported
      window.toast("file not supported", 3000);
      return;
    }

    let selectionRange = editor.getSelectionRange();
    // selected text by user
    let selectedText = editor.getSelectedText();
    // get the syntax for the file extension
    let cmt = cmtSyntax[extname] || cmtSyntaxDouble[extname];
   
    //if the extension is html or css we do multi line comment instead of single line
    if (extname == "html" || extname == "css") {
      if (selectedText.startsWith(cmt["first"], 0)) {
        let modifiedText = selectedText.replace(cmt["first"], "");
         modifiedText = modifiedText.replace(cmt["last"], "");
        // Replace the selected text with the commented text
        editor.getSession().replace(selectionRange, modifiedText);
        // Show a success toast message
        window.toast("Success", 2000);
        return;
      }
      let modifiedText = cmt["first"] + selectedText + cmt["last"];
      // Replace the selected text with the commented text
      editor.getSession().replace(selectionRange, modifiedText);
      // Show a success toast message
      window.toast("Success", 2000);
      return;
    }
    let lines = selectedText.split("\n");
    let modifiedText = lines.map((line) => {
      if (typeof cmt === "object") {
        return this.doubleCommentParser(cmt, line);
      } else {
        return this.singleCommentParser(cmt, line);
      }
    });
    let newText = modifiedText.join("\n");

    // Replace the selected text with the commented text
    editor.getSession().replace(selectionRange, newText);

    // Show a success toast message
    window.toast("Success", 2000);
  }

  // Get the file extension from the filename
  getExt(filename) {
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
  extNotSupported(ext) {
    return !supportedExt.includes(ext);
  }

  // Parse double-line comments
  doubleCommentParser(cmt, line) {
    if (line.startsWith(cmt["first"], 0)) {
      let parsed = line.replace(cmt["first"], "");
      return parsed.replace(cmt["last"], "");
    }
    return cmt["first"] + line + cmt["last"];
  }

  // Parse single-line comments
  singleCommentParser(cmt, line) {
    if (line.startsWith(cmt, 0)) {
      return line.replace(cmt, "");
    }
    return cmt + line;
  }

  async destroy() {
    // Clean up or perform any necessary actions when the plugin is destroyed
  }
}

if (window.acode) {
  const acodePlugin = new CodeCommenter();

  acode.setPluginInit(
    plugin.id,
    (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      acodePlugin.init($page, cacheFile, cacheFileUrl);
    }
  );

  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
