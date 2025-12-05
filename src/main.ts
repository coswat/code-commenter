import plugin from "../plugin.json";
const selectionMenu = acode.require("selectionMenu");
const appSettings = acode.require("settings");
const Confirm = acode.require("confirm");
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
// Interface for Settings Item
interface SettingItem {
	key: string;
	text: string;
	checkbox: boolean;
	info: string;
}
// Interface for Settings List
interface SettingsList {
	list: SettingItem[];
	cb: (key: string, value: boolean) => void;
}

type CommentTypes = CommentSyntax | DoubleLineCommentSyntax;

type DoubleOrString = string | DoubleLineCommentSyntax;

// Supported languages
const supportedLang: string[] = [
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
	"jsonc", // JsonC
	"jsx", // Jsx
	"kt", // Kotlin
	"lua", // Lua
	"mjs", // Javascript
	"md", // Markdown
	"php", // PHP
	"pl", // Perl
	"py", // Python
	"rb", // Ruby
	"rs", // Rust
	"sass", // SASS
	"scss", // SCSS
	"sh", // Shell
	"swift", // Swift
	"sql", // SQL
	"sqlite", // SQLite
	"ts", // Typescript
	"tsx", // Tsx
];

// Supported templating engines
const supportedTempl: string[] = [
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
const supportedFiles: string[] = [
	"Dockerfile",
	"env", // Environment File
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
	Dockerfile: "# ",
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

// Comment syntax for double-line comments ( these files/languages only supports multi comments )
const cmtSyntaxDouble: {
	[key: string]: DoubleLineCommentSyntax;
} = {
	html: { first: "<!-- ", last: " -->" },
	md: { first: "<!-- ", last: " -->" },
	twig: { first: "{# ", last: " #}" },
	blade: { first: "{{-- ", last: " --}}" },
	hbs: { first: "{{!-- ", last: " --}}" },
	css: { first: "/* ", last: " */" },
	mako: { first: "<%# ", last: " %>" },
	mst: { first: "<!-- ", last: " -->" },
	mustache: { first: "<!-- ", last: " -->" },
	sass: { first: "/* ", last: " */" },
	scss: { first: "/* ", last: " */" },
	tpl: { first: "{* ", last: " *}" },
	xml: { first: "<!-- ", last: " -->" },
	liquid: { first: "{# ", last: " #}" },
};

// Languages which supported multi syntax and single ( this particular var is for the double one btw )
const multiBoxComment: {
	[key: string]: DoubleLineCommentSyntax;
} = {
	c: { first: "/* ", last: " */" },
	cc: { first: "/* ", last: " */" },
	cpp: { first: "/* ", last: " */" },
	cs: { first: "/* ", last: " */" },
	cxx: { first: "/* ", last: " */" },
	dart: { first: "/* ", last: " */" },
	go: { first: "/* ", last: " */" },
	h: { first: "/* ", last: " */" },
	hpp: { first: "/* ", last: " */" },
	hxx: { first: "/* ", last: " */" },
	inl: { first: "/* ", last: " */" },
	ipp: { first: "/* ", last: " */" },
	java: { first: "/* ", last: " */" },
	js: { first: "/* ", last: " */" },
	jsx: { first: "/* ", last: " */" },
	kt: { first: "/* ", last: " */" },
	mjs: { first: "/* ", last: " */" },
	php: { first: "/* ", last: " */" },
	rs: { first: "/* ", last: " */" },
	swift: { first: "/* ", last: " */" },
	ts: { first: "/* ", last: " */" },
	tsx: { first: "/* ", last: " */" },
	sql: { first: "/* ", last: " */" },
	sqlite: { first: "/* ", last: " */" },
	hs: { first: "{- ", last: " -}" },
	lua: { first: "--[[ ", last: " ]]" },
	rb: { first: "=begin ", last: " =end" },
	pl: { first: "=begin ", last: " =cut" },
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

	// Create the plugin settings with default values.
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

	// Add the (//) button in the editor
	public async init(): Promise<void> {
		// Add the comment action to the selection menu
		selectionMenu.add(this.action.bind(this), "//", "selected");
	}

	// Plugin Action
	public async action(): Promise<void> {
		const { editor, activeFile } = editorManager;
		await this.loadExtensions();
		// extension name
		let extname: string = await this.getExt(activeFile.name);

		if (this.extNotSupported(extname)) {
			// Show a toast message if the file extension is not supported
			toast("File type not supported", 3000);
			return;
		}

		let selectionRange = editor.getSelectionRange();
		// selected text by user
		let selectedText = editor.getSelectedText();
		// get the lines length
		let line_len = selectedText.split(/\r?\n/).length;
		// get the comment syntax for the file extension
		let cmt: DoubleOrString;
		let loader: boolean;

		if (selectedText.trimStart().startsWith(cmtSyntax[extname])) {
			loader = false;
			cmt = cmtSyntax[extname] || cmtSyntaxDouble[extname];
		} else if (line_len >= 4) {
			if (!multiBoxComment[extname] && !cmtSyntaxDouble[extname]) {
				loader = false;
				cmt = cmtSyntax[extname] || cmtSyntaxDouble[extname];
			} else {
				loader = true;
				cmt = multiBoxComment[extname] || cmtSyntaxDouble[extname];
			}
		} else {
			loader = false;
			cmt = cmtSyntax[extname] || cmtSyntaxDouble[extname];
		}

		// If the extension supports multi comments and multi comment is enabled
		// in the settings, we do multi line comment instead of single line
		if (
			this.settings.multiComment &&
			this.multiSupport(extname, line_len, loader)
		) {
			if (selectedText.trimStart().startsWith(cmt["first"])) {
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
		let newText: string = modifiedText.join("\n");

		// Replace the selected text with the commented text
		editor.getSession().replace(selectionRange, newText);
		// Reset the extensions
		this.extensions = [];
		// Show a success toast message
		toast("Success", 2000);
	}

	// Get the file extension from the filename
	private async getExt(filename: string): Promise<string> {
		// We do this if statement becacause some files
		// does not have a (.) to separate, ex. Makefile Dockerfile etc
		// We make sure it is also checked with this.
		if (supportedFiles.includes(filename)) {
			return filename;
		}

		// Every other files with (.)
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

	// Check if the file extension is supported or not
	private extNotSupported(ext: string): boolean {
		return !this.extensions.includes(ext);
	}

	// Parse double-line comments
	private doubleCommentParser(cmt: CommentTypes, line: string): string {
		if (line.trimStart().startsWith(cmt["first"])) {
			let parsed = line.replace(cmt["first"], "");
			return parsed.replace(cmt["last"], "");
		}
		return cmt["first"] + line + cmt["last"];
	}

	// Parse single-line comments
	private singleCommentParser(cmt: string, line: string): string {
		if (line.trimStart().startsWith(cmt)) {
			return line.replace(cmt, "");
		}
		return cmt + line;
	}

	// get settings list
	public get settingsList(): SettingsList {
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
					info: "Enable comment support for files, ex: files like .env, .gitignore etc",
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

	// Reload the app function
	private async reload(): Promise<void> {
		let confirm = await Confirm("NOTE", "Click ok to reload the app");
		if (confirm) setTimeout(() => location.reload(), 500);
	}

	// Get the enitire plugin settings value from settings.json
	public get settings() {
		return appSettings.value[plugin.id];
	}

	// This function will be called while unininstalling our plugin.
	// We need to remove or pluggin settings from the app settings.
	public async destroy(): Promise<void> {
		delete appSettings.value[plugin.id];
		appSettings.update(true);
		// reloading after deleting the settings.
		await this.reload();
	}

	// Load supported extesions from users settings
	private async loadExtensions(): Promise<void> {
		this.extensions.push(...supportedLang);
		if (this.settings.fileMode) {
			this.extensions.push(...supportedFiles);
		}
		if (this.settings.templEngineMode) {
			this.extensions.push(...supportedTempl);
		}
	}

	// We are checking if the extension supports multi comments
	// or not by fetching from the settings.
	private multiSupport(
		ext: string,
		line_len: number,
		loader: boolean
	): boolean {
		if (line_len >= 4 && loader) {
			return !!(multiBoxComment[ext] || cmtSyntaxDouble[ext]);
		} else {
			return !!cmtSyntaxDouble[ext];
		}
	}
}

// DEFAULTS: No edits here.
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
