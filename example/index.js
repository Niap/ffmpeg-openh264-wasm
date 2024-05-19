ffmpegWorker = new Worker("worker.js");
coreLoaded = false;
this.ffmpegWorker.onmessage = (e)=>{
  const {command,params} = e.data;
  if( command == "ffmpeg" ){
    const {fileName,targetType,videoData} = params;
   // utils.saveFile(new Blob([videoData], {type:intputMine[targetType]} ),fileName+"."+targetType);
  }else if(command == "load"){
    coreLoaded = true;
  }else if(command == "ffprobe"){
    
  //  UI.swtichToDetail(params);
  }
}
function clickToGetInfo(){
  fetch("./video.mp4", { credentials: 'same-origin' }).then((response)=>{
    response.arrayBuffer().then((binary)=>{
       getInfo('video',new Uint8Array(binary),"mp4");
    })
  })
}

function clickToConvert(){
  fetch("./video.mp4", { credentials: 'same-origin' }).then((response)=>{
    response.arrayBuffer().then((binary)=>{
       convert('video',new Uint8Array(binary),"mp4","flv");
    })
  })
}


function getInfo(fileName,fileData,sourceType){
  ffmpegWorker.postMessage({
    command:"ffprobe",
    params:{
      fileName:fileName,
      sourceType:sourceType,
      fileData:fileData
    }
  });
}

function convert(fileName,fileData,sourceType,targetType){
  ffmpegWorker.postMessage({
    command:"ffmpeg",
    params:{
      fileName:fileName,
      targetType:targetType,
      sourceType:sourceType,
      fileData:fileData
    }
  });
}

// fetch("./converter.wasm", { credentials: 'same-origin' }).then((response)=>{
//   console.log("转码程序下载完成.")
//     response.arrayBuffer().then((binary)=>{
//       ffmpegWorker.postMessage({
//         command:"load",
//         params:binary
//       });
//       console.log("转码程序加载完成.")
//     })
// })