// import {TopText} from "./libs/abcjs/dist/abcjs-basic.js";

function printCanvas(c) {
    var dataUrl = document.getElementById(c).toDataURL(); //attempt to save base64 string to server using this var  
    var windowContent = '<!DOCTYPE html>';
    windowContent += '<html>'
    windowContent += '<head><title>Print canvas</title></head>';
    windowContent += '<body>'
    windowContent += `<img style="width:100%" src="${dataUrl}" onload=window.print();window.close();>`;
    windowContent += '</body>';
    windowContent += '</html>';
    var printWin = window.open();
    printWin.document.open();
    printWin.document.write(windowContent);
}

function renderLapHarpSheet(music, dim) {
	// https://unicode-table.com/en/blocks/musical-symbols/
	// https://fonts.google.com/noto/specimen/Noto+Music/tester
	const noteHeads = {
		0.03125: '𝅘𝅥𝅱',
		0.0625: '𝅘𝅥𝅯',
		0.125: '𝅘𝅥𝅮',
		0.25: '𝅘𝅥',
		0.5: '𝅗𝅥',
		1:'𝅝',
		0.046875: '𝅘𝅥𝅱𝅭',
		0.09375: '𝅘𝅥𝅯𝅭',
		0.1875: '𝅘𝅥𝅮𝅭',
		0.375: '𝅘𝅥𝅭',
		0.75: '𝅗𝅥𝅭',
		1.5: '𝅝𝅭',
	}
	const restHeads = {
		0.03125: "𝅀",
		0.0625: "𝅀",
		0.125: "𝄾",
		0.25: "𝄽"
	}
	const noteOffsetX = 12
	const noteOffsetY = 30

	const canvas = new fabric.StaticCanvas('lapharp', {selection: false});
	window.cv = canvas
	// canvas.selection = false

	// clear
	$(".lapharp").empty()//.hide()

	const zoom = 125 // DPI
	const t = dim.lpTopW 
	const b = dim.lpBottomW
	const h = dim.lpLength
	canvas.setHeight(dim.ppHeight*zoom)//(h*zoom)
	canvas.setWidth(dim.ppWidth*zoom)//(b*zoom)

	// Calibration Square 1x1in
	let calPts=[
		{x: 1*zoom, y: 1*zoom},
		{x: 2*zoom, y: 1*zoom},
		{x: 2*zoom, y: 2*zoom},
		{x: 1*zoom, y: 2*zoom}
	]
	let cal = new fabric.Polygon(calPts, {
		fill: "#EEEEEE"
	})
	canvas.add(cal)
	

	// Lap Harp
	let lhPts = [
		{x: 0, y: h*zoom},
		{x: b*zoom, y: h*zoom},
		{x: (t + (b-t)/2)*zoom, y: 0},
		{x: (b-t)/2*zoom, y: 0}
	]
	let lhOutline = new fabric.Polygon(lhPts, {
		strokeWidth: 1,
		stroke: "#AAAAAA",
		fill: "#FFFFFF"
	})
	canvas.add(lhOutline)


	// Music Space
	let triBottom = (b-t)/2
	let marginH = 0.375
	let mt = t+2*triBottom*(dim.lpTopToString/h) - marginH*2 // TODO
	let mb = b-2*triBottom*(dim.lpBottomToString/h) - marginH*2 //b - 2 // TODO
	let mh = h - dim.lpTopToString - dim.lpBottomToString

	let musicPts = [
		{x: (b-mb)/2*zoom, y: (h-dim.lpBottomToString)*zoom},
		{x: (b-(b-mb)/2)*zoom, y: (h-dim.lpBottomToString)*zoom},
		{x: (mt + (b-mt)/2)*zoom, y: (dim.lpTopToString*zoom)},
		{x: (b-mt)/2*zoom, y: dim.lpTopToString*zoom}
	]
	let musicTrap = new fabric.Polygon(musicPts, {
		strokeWidth: 4,
		fill: "#DDDDDD"
	})
	// canvas.add(musicTrap)

	// render strings
	for (let i=0; i<music.tuning.length; i++) {
		let cvLine = new fabric.Line([0, (mh-mh/(music.tuning.length-1)*i+dim.lpTopToString)*zoom, b*zoom, (mh-mh/(music.tuning.length-1)*i+dim.lpTopToString)*zoom], {stroke: '#AAA'})
		// canvas.add(cvLine)
	}

	// render notes
	let errors = []
	let lhpos = []
	for (let i=0; i<music.notes.length; i++) {
		let chord = music.notes[i].pitches
		let note = music.notes[i]
		let idx = i
		for (let i=0; i<chord.length; i++) {
			// console.log
			let pitch = chord[i]
			if (music.tuning.indexOf(pitch) == -1 && pitch != "z") {
				errors.push(idx)
				console.log('error')
			}
			else {
				let sqX = idx/(music.notes.length-1) - 0.5
				let sqY =  pitch == "z" ? lhpos[lhpos.length-1].squarePos.y : music.tuning.indexOf(pitch)/(music.tuning.length-1)
				// console.log(sqX, sqY)
				lhpos.push({
					noteChar: pitch == "z" ? restHeads[note.duration] : noteHeads[note.duration],
					harpPos: {
						x: idx,
						y: music.tuning.indexOf(pitch)
					},
					squarePos: {
						x: sqX,
						y: sqY
					},
					trapPos: {
						x: (mt*sqY + mb*(1-sqY)) * sqX + mb/2 + (b-mb)/2,
						y: mh * sqY + dim.lpBottomToString
					}
				})
			}
		}
	}
	console.log('errors', errors)
	if (errors.length > 0)
		console.error('following note numbers not in tuning schema', errors)
	else {
		let prevX
		let prevY
		let currX
		let currY
		for (let i=0; i<lhpos.length; i++) {
			currX = (lhpos[i].trapPos.x)*zoom - noteOffsetX
			currY = h*zoom - lhpos[i].trapPos.y*zoom - noteOffsetY
			let cvNote = new fabric.Text(lhpos[i].noteChar, {fontFamily: "Noto Music", fill: 'black', left: currX, top: currY})
			canvas.add(cvNote)
			// render line
			if (i>0) {
				let noteLine = new fabric.Line([prevX+noteOffsetX, prevY+noteOffsetY, currX+noteOffsetX, currY+noteOffsetY], {stroke: '#555'})
				canvas.add(noteLine)
			}
			prevX = currX 
			prevY = currY
		}
		$(".lapharp-container").show()
	}
}

function parseMusic(music) {
	// console.log('parsing', music)

	// tuning
	let tuningObj = ABCJS.renderAbc("tuning", music.tuning)[0] // assumes 1 tune
	let tuning = []
	for (let i=0; i<tuningObj.lines[0].staff[0].voices[0].length; i++) {
		tuning.push(tuningObj.lines[0].staff[0].voices[0][i].pitches[0].pitch)
	} 

	// music
	let abc = music.music
	let abcObj = ABCJS.renderAbc("staff", abc, {staffwidth: 720, wrap: { minSpacing: 1.8 }})[0] // assumes 1 tune
	window.abcObj = abcObj
	let notes = []

	for (let i=0; i<abcObj.lines.length; i++) {
		let line = abcObj.lines[i]
		// NOTE: assume 1 staff & 1 voice
		for (let i=0; i<line.staff[0].voices[0].length; i++) {
			let note = line.staff[0].voices[0][i]
			let noteObj = {
				duration: note.duration,
				pitches: []
			}
			if (note.el_type == "note") {
				if (note.pitches != undefined) {
					for (let i=0; i<note.pitches.length; i++) {
						noteObj.pitches.push(note.pitches[i].pitch)
					}					
				}
				else if (note.rest != undefined) {
					noteObj.pitches.push("z")
				}
				notes.push(noteObj)				
			}
		}
	}

	$(".staff-preview").show()
	return {notes: notes, tuning: tuning}
}

function getNoteFromStr(str) {
	const validNotes = ["a", "b", "c", "d", "e", "f", "g"]
	const validBeats = [1,2,4,8,16,32,64]
	const chord = []
	for (let i=0; i<validNotes.length; i++) {
		// if (str.indexOf(validNotes[i])> -1)npm
			// chord.push() validNotes[i]
	}
}

function fillTestData() {
	const testData = {
		dimensions: {
	    "lpTopW": 4.5,
	    "lpBottomW": 12.125,
	    "lpLength": 7.75,
	    "lpTopToString": 0.25,
	    "lpBottomToString": 0.6875,
	    "lpNumStrings": 15,
	    "ppHeight": 8.5,
	    "ppWidth": 11
		},
		tuning: "CDEFGABC'D'E'F'G'A'B'C''",
		// music: "cc'4  c g g a a g2e4 c f4 f e e d d c4 | a'4 a' g' g' f' f' e'4 a'4 a' g' g' f'8 g'16 f' g'8. a'16 g'4 f'"
  	// music: "L:1/4\nCCGG|AAGz|FFEE|DD[CC'C'']2|ggff|eed2|ggff|e/2f/4d/4 e3/4f/4 e d"
  		music: "L:1/4\nCCGG|AAG2|FFEE|DDCz|ggff|eed2|ggff|e/2f/4d/4 e3/4f/4 e d|"
	}

	$(".dim").each(function() {
		let k = $(this).data("key")
		$(this).val(testData.dimensions[k])
	})
	$(".tuning").val(testData.tuning)
	$(".music").val(testData.music)
	// $("textarea").val(JSON.stringify(testData, null, 2))
}



export { fillTestData, parseMusic, renderLapHarpSheet, printCanvas }