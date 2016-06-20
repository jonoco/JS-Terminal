let ScreenController = function() {
	this.textarea = document.querySelector('#text');
	this.textarea.addEventListener('keydown', this._handleArgs.bind(this), true);
	
	this.callbacks = {}; 		 // holds all set commands
	this.systemID = 'system';
	
	this.screenData;				 // temp screen save for composition
	this.composing = false;  // composition flag
	this.compositionData;		 // temporary composition data holder
	this.compositionCommand; // command provided for new composition
};

// internal: keydown event handler
ScreenController.prototype._handleArgs = function(event) {
	
	// command composition mode
	if (this.composing) {
		if (event.which == 13) {
			let args = this._getArgs();
			if (args[0] == 'quit') this.exitComposition();
		}
		
		return;
	}
	
	// backspace key
	if (event.which === 8) {
		this.removeChar();	
		event.preventDefault();
		
		return;
	}
	
	// enter key
	if (event.which == 13) {
		event.preventDefault();
		
		let args = this._getArgs();
		this.message(''); // add line break manually
		
		let callback = this.getCommand(args[0]);	
		if (callback) { 
			console.log('type: ', typeof callback);
			console.log(callback);
			if (typeof callback == 'string') {
				let commandArgs = args[1] || null;
				eval('(' + callback + ')')(commandArgs);	
			} else {
				callback(args.slice(1)); 	
			}
			
		} else if (args[0] === '') {
			return; // ignore empty args
		} else { 
			this.sysMessage(`${args[0]}: command not found`); 
		}
	}
};

// gets callback for a provided argument
ScreenController.prototype.getCommand = function(arg) {
	return this.callbacks[arg];
};

// sets callback for an argument
ScreenController.prototype.setCommand = function(arg, cb) {
	this.callbacks[arg] = cb;
};

// prints system styled message
ScreenController.prototype.sysMessage = function(string) {
	this.message(`- ${this.systemID}: ${string}`);
};

// internal: parses args from the textarea screen
ScreenController.prototype._getArgs = function() {
	let screen = this._load().trim();
	let array = screen.split('\n');
	let lastLine = array[array.length-1];
	let args = lastLine.split(' ');
	return args;
};

// internal: returns all text from the textarea screen
ScreenController.prototype._load = function() {
	return this.textarea.value;
};

// internal: replaces the textarea text with updated data
ScreenController.prototype._save = function(string) {
	this.textarea.value = string;
	this.textarea.scrollTop = this.textarea.scrollHeight;
};

// prints a line to the screen
ScreenController.prototype.message = function(string) {
	let screenData = this._load();
	screenData += `${string}\n`;
	this._save(screenData);
};

// clears the screen
ScreenController.prototype.clear = function() {
	this._save('');
};

// sets a new system name
ScreenController.prototype.setSystemID = function(string) {
	this.systemID = string;
};

// enter the function composition screen
ScreenController.prototype.enterComposition = function(command) {
	console.log('entering composition for command: ' + command);
	this.compositionCommand = command;
	this.composing = true;
	this.screenData = this._load();
	this.clear();

	this.sysMessage('type \'quit\' on a new line to exit composition');

	// if editing existing command, show it
	let editCommand = this.getCommand(command);	
	if (editCommand) this.message(editCommand);
	
};

// exits composition screen
ScreenController.prototype.exitComposition = function() {
	console.log('exiting composition');
	this.composing = false;
	this.compositionData = this._load();
	this._saveComposition();
	
	this.clear();
	this._save(this.screenData); // reset the original screen
};

// saves the composition to the command array
ScreenController.prototype._saveComposition = function() {
	let rawComposition = this.compositionData.trim();

	// trim 'exit' and additional line break
	let splitArray = rawComposition.split('\n');
	let cleanedArray;
	
	// remove system message in a primitive way
	if (splitArray[0][0] === '-') {
		cleanedArray = splitArray.slice(1, -1);
	} else {
		cleanedArray = splitArray.slice(0, -1);
	}
 
	let newComposition = cleanedArray.join('\n');
	
	// save composition directly rather than eval
	this.setCommand(this.compositionCommand, newComposition);
	
	// this.setCommand(this.compositionCommand, () => {
	// 	return eval(newComposition);
	// });
};

// saves the function to the command array
ScreenController.prototype.saveFunction = function(arg, func) {
	this.setCommand(arg, () => {
		return eval(func);
	})
};

// adds a character the screen
ScreenController.prototype.addChar = function(char, index) {
	let screenData = this._load();
	
	if (index) {
		let before = screenData.slice(0, index);
		let after = (index == screenData.length-1) ? screenData[index] : screenData.slice(index, screenData.length-1);
		before += char;
		let join = before + after;
		
		console.log(before, after);
		
		this._save(join);	
		
	} else {	
		screenData += `${char}`;
		this._save(screenData);		
	}
};

// remove a char from the screen
ScreenController.prototype.removeChar = function(index) {
	let screenData = this._load();
	
	if (index) {
		console.log('splicing at ' + index);
		let newScreenData = screenData.splice(index, 1);
		this._save(newScreenData);
	} else {
		let lastChar = screenData[screenData.length-1];
		if (lastChar !== '\n') {
			let newScreenData = screenData.slice(0, -1);
			this._save(newScreenData);
		}	
	}
}

// -- IMPLEMENT

let screen = new ScreenController();
screen.sysMessage('use help for a list of available commands');

// -- CREATING COMMANDS
/**
 * Use the setCommand(:string, :function) method 
 * to create new commands.
 */

screen.setCommand('help', (args) => {
	if (args.length) {
		screen.sysMessage(`i'm sorry, i can't help ${args}`); 
	} else {
		let commands = Object.keys(screen.callbacks).join('\n ');
		screen.sysMessage(`commands available: \n ${commands}`);		
	}
});

screen.setCommand('clear', () => {
	screen.clear();
});

screen.setCommand('setid', (args) => {
	if (args.length) { 
		let newID = args.join(' ');
		screen.sysMessage('setting new system id to: ' + newID);
		screen.setSystemID(newID);	
	} else {
		screen.sysMessage(`please provide a new id
		useage: setid [id]
		e.g.: setid HAL 9000
			`); 
	}
});

screen.setCommand('bobby', () => {
	screen.sysMessage('damnit bobby!');
});

screen.setCommand('time', () => {
	let time = new Date();
	screen.message(time);
});

screen.setCommand('print', () => {
	print();
});

screen.setCommand('compose', (args) => {
	if (args.length) {
		screen.enterComposition(args[0]);	
	} else {
		screen.sysMessage(`please provide a command name to begin composing
		useage: compose [command]
		e.g.: compose time
			`);
	}
});

screen.setCommand('function', (args) => {
	if (args.length > 1) {
		console.log(args.length);
		let arg = args[0];
		let func = args.slice(1).join(' ');
		console.log(func);
		
		screen.saveFunction(arg, func);
	} else {
		screen.sysMessage(`please provide a function name and function body
		useage: function [name] [body]
		e.g.: function alert window.alert('hello');
			`);
	}
});
