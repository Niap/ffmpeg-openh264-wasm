const readFromBlobOrFile = (blob) => (
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = ({ target: { error: { code } } }) => {
      reject(Error(`File could not be read! Code=${code}`));
    };
    fileReader.readAsArrayBuffer(blob);
  })
);

const runMain = async (ifilename, data,ofilename ,args) => {
  let resolve = null;
  let file = null;
  const Core = await createVme({
    printErr: (m) => {
      console.log(m);
    },
    print: (m) => {
      console.log(m);
      if (m.startsWith('MAIN_END')) {
        resolve();
      }
    },
  });
  Core.FS.writeFile(ifilename, data);
  main(Core, args);
  await new Promise((_resolve) => { resolve = _resolve });
  if (typeof ofilename !== 'undefined') {
    file = Core.FS.readFile(ofilename);
    Core.FS.unlink(ofilename);
  }
  return { Core, file };
};


const runFFmpeg = async (ifilename, data, args, ofilename, extraFiles = []) => {
  let resolve = null;
  let file = null;
  const Core = await createFFmpegCore({
    printErr: (m) => {
      console.log(m);
    },
    print: (m) => {
      console.log(m);
      if (m.startsWith('FFMPEG_END')) {
        resolve();
      }
    },
  });
  extraFiles.forEach(({ name, data: d }) => {
    Core.FS.writeFile(name, d);
  });
  Core.FS.writeFile(ifilename, data);
  ffmpeg(Core, args);
  await new Promise((_resolve) => { resolve = _resolve });
  if (typeof ofilename !== 'undefined') {
    file = Core.FS.readFile(ofilename);
    Core.FS.unlink(ofilename);
  }
  return { Core, file };
};


const runFFprobe = async (ifilename, data, args, ofilename) => {
  let resolve = null;
  let file = null;
  const Core = await createFFmpegCore({
    printErr: (m) => {
      console.log(m);
      if (m.startsWith('END')) {
        resolve();
      }
    },
    print: (m) => {
      console.log(m);
      
    },
  });
  
  Core.FS.writeFile(ifilename, data);
  ffprobe(Core, args);
  await new Promise((_resolve) => { resolve = _resolve });
  if (typeof ofilename !== 'undefined') {
    file = Core.FS.readFile(ofilename);
    Core.FS.unlink(ofilename);
  }
  return { Core, file };
};


const main = (Core,args) => {
  Core.ccall(
    'proxy_main',
    'number',
    ['number', 'number'],
    parseArgs(Core, [...args]),
  );
};


const ffmpeg = (Core,args) => {
  Core.ccall(
    'proxy_main',
    'number',
    ['number', 'number'],
    parseArgs(Core, ['ffmpeg', '-nostdin', ...args]),
  );
};

const ffprobe = (Core,args) => {
  Core.ccall(
    'proxy_main',
    'number',
    ['number', 'number'],
    parseArgs(Core, ['ffprobe', ...args]),
  );
};

const parseArgs = (Core, args) => {
  const argsPtr = Core._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  args.forEach((s, idx) => {
    const buf = Core._malloc(s.length + 1);
    Core.writeAsciiToMemory(s, buf);
    Core.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
  });
  return [args.length, argsPtr];
};


const b64ToUint8Array = (str) => (Uint8Array.from(atob(str), c => c.charCodeAt(0)));
