

const parseArgs = (Core,args) => {
    const argsPtr = Core._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
    args.forEach((s, idx) => {
        const buf = Core._malloc(s.length + 1);
        Core.writeAsciiToMemory(s, buf);
        Core.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
    });
    return [args.length, argsPtr];
};

const trancode = (inputFile,fileData,num,start,end)=>{

    Core.FS.writeFile(inputFile, fileData);
    var outputFile = `/video_${num}.ts`;
    console.time("a")
    try{
        Core._convert(['ffmpeg', "-i", inputFile, '-c', 'copy', outputFile]);
    }catch(e){
        console.log(e)
    }
    console.timeEnd("a")
    var outFile = Core.FS.readFile(outputFile);
    postMessage(outFile);
}


const probe = (Core,inputFile,fileData)=>{
    Core.FS.writeFile(inputFile, fileData);
    try{
        Core.ccall(
            'main',
            'number',
            ['number', 'number'],
            parseArgs(Core,['ffprobe', '-print_format','json', '-show_format', '-show_streams', '-i', inputFile]),
        );
    }catch(e){
        console.log(e)
    }
    var fileData = Core.FS.readFile("/out.txt");
    postMessage({
        type:"probe",
        fileData:fileData
    });
}

onmessage = function(e) {
    const {opration,fileData} = e.data;

    createConverter({
        printErr: (m) => {
          console.log(m);
        },
        print: (m) => {
          console.log(m);
        },
    }).then((Core)=>{
        switch(opration){
        case "trancode":
            break;
        case "probe":
            probe(Core,"/probe.mp4",fileData);
            break;
        case "concat":
            break;
    }
    })

    
   
   
}

self.importScripts('converter.js');