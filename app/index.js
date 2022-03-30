const { app, BrowserWindow, ipcMain, dialog, Menu } = require( 'electron' );
const path = require( 'path' );
const fs = require('fs');
const fse = require('fs-extra')
const targz = require('targz');
const exec = require('child_process').execFile
const decompress = require('decompress');
const FILES = {
    eventServer: "GLOG_EventServer.log.tar.gz",
    transaction: "GLOG_DebugTransaction.log.tar.gz"
}
// open a window

//LISTENERS
ipcMain.on("send-dates", (event,renderData) => {
  //AQUI TENEMOS EL ARRAY CON LAS FECHAS A ANALIZAR.
  //POR CADA FECHA CREAMOS UN DIRECTORIO Y DESCOMPRIMIMOS LOS ARCHIVOS.
  const {array, inputValue} = renderData
  console.log("arraydate", renderData)
  array.forEach(date => {
    const formmatedDate = new Date(date)
    const fMonth = formmatedDate.getMonth();
    const fDay = formmatedDate.getDate();
    const fYear = formmatedDate.getFullYear()
    let path = __dirname + "\\tmp\\var\\log\\glylog\\"
    console.log("path: ", path)
    const files = fs.readdirSync(path)
    files.forEach(async (file) => {
      let exist = false
      if(file.includes(FILES.eventServer) || file.includes(FILES.transaction)){
        exist = true;
      }
      if(exist){
        const archivo =fs.statSync(path+file)
        let date = new Date(archivo.mtime);
        const day = date.getDate();
        const month = date.getMonth();
        const year = date. getFullYear();
        if(day === fDay && month === fMonth && year === fYear){ // SI IGUALES EXTRAEMOS
          //CREAR LA CARPETA DENTRO DE GLYLOG CON EL DIA Y MES
          const directory = `${month}-${day}`;
          console.log(path)
          console.log("directory: ", directory)
          if (!fs.existsSync(`${path}${directory}`)){
            fs.mkdirSync(`${path}${directory}`);
          }
          unzip = new Promise((resolve, reject) => {
              decompress( `${path}${file}`, `${path}\\${directory}`)
                .then(files => {
                  return resolve(true);
                  // return "true";
                })
                .catch(err => {
                  reject(false)
                })
              })
        }
      }
    })
    //DESCOMPRIMIR EN EL DIRECTORIO LOS ARCHIVOS
  })
  console.log("input value: ", inputValue)
  fs.mkdirSync(inputValue)
  fse.move('./app/tmp', `./${inputValue}`,  { overwrite: true }, err => {
    if (err) return console.error(err)
    console.log('success!')
  })
  exec('C:\\Users\\gonzalda\\Desktop\\Log Viewer v10\\bin\\Debug\\CI_LogViewer', function(err, data) {  
    console.log(err)
    console.log(data.toString());       
    return true                
  });  
})

ipcMain.on('send-directory', directoryName => {
  console.log("directorio: ", directoryName)
})

async function unzipFiles (file, path, directory){
  console.log("file", file)
  console.log("path", path);
  console.log("dir:", directory)
  const result = await decompress( `${path}${file}`, `${path}\\${directory}`)
  if(result){
    return true
  }
  return false
  }

//END LISTENERS
const openWindow = () => {
    const win = new BrowserWindow( {
        width: 800,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    });

    // load `index.html` file
    win.loadFile( path.resolve( __dirname, 'render/html/index.html' ) );
    const options = {
      defaultPath: app.getAppPath(), // open de directory where is running the application.
      buttonLabel: 'Abrir',
    }
    win.webContents.openDevTools();

    const openDialog = () => {
      const file = dialog.showOpenDialogSync(options)
      console.log("file", file)
      if (file === 'undefined'){
        console.log("error")
      }
      descompress(file); // guarda la ruta del archivo descomprimido.
    }
    function createSelect(arraySorted, completeArrayDateSorted ) {
        win.webContents.send('send-select', {arraySorted, completeArrayDateSorted});
    }
    const descompress = (file) => {
      const ok = new Promise((resolve, reject) => {
        targz.decompress({
          src: file[0],
          dest: `${options.defaultPath}/tmp` //crea carpeta tmp en el directorio del programa
          }, function(err){
              if(err) {
                reject(err)
                console.log(err);
              } else {
                resolve(true)
                console.log("Done!");
              }
        });
      })

      //EXTRAEMOS LOS FICHEROS
      ok.then(async (data) => {
        if (data){
          console.log("tofo de p.m")
          const path = `${options.defaultPath}\\tmp\\var\\log\\glylog\\`
          const files = fs.readdirSync(path)
          let array = [];
          let arrayCompleteDate = [];
          files.forEach((file) => {
            const exist = file.includes('DebugTransaction.log.tar');
            if(exist){
              const archivo =fs.statSync(path+file)
              // hacemos el formato de la fecha
              const date = new Date(archivo.mtime)
              const options = { year: 'numeric', month: 'long', day: 'numeric' }
              array.push(`${new Intl.DateTimeFormat('en-US', options).format(date)}`)
              arrayCompleteDate.push(date);
              // FINAL FORMATEAR FECHA Y LO AÑADIMOS EN EL ARRAY
            }
          })
          //ORDENAMOS EL ARRAY POR FEECHA
          const arraySorted = array.sort((a, b) => b.date + a.date);
          const arrayCompleteDateSorted = arrayCompleteDate.sort((a, b) => b.date + a.date)
          arraySorted.forEach(file => { 
            console.log(file)
          })
          createSelect(arraySorted, arrayCompleteDateSorted);
        }
        })
      }
    
   
        win.webContents.on("did-finish-load", () => {
          // openDialog();
          // const file = dialog.showOpenDialogSync(options)
          errorFinder();
          return win; // return window
        });
    }

const errorFinder = () => {
  console.log("error finder")
//   fs.readFile('GLOG_SplCasherServer.log.001.div', 'utf8', function(err, data) {
//     if (err) throw err;
//     if(data.includes('GLY_ERROR (')){
//       console.log("position: ", data.indexOf("GLY_ERROR ("));
//       let position = data.indexOf("GLY_ERROR (") + 11;
//       // console.log(data[position+11])
//       let error = "";
//       for (let i = 0; i < 4 ; i++){
//         console.log(data[position])
//         error = error + data[position]
//         position++
//       }
//       var regex = /GLY_ERROR\s/g, result, indices = [];
//       while ( (result = regex.exec(data)) ) {
//         indices.push(result.index);
//       }
//       console.log("indices: ",indices)
//     }
//     // const error = 
// });
  const allFileContents = fs.readFileSync('GLOG_SplCasherServer.log.001.div', 'utf-8');
  allFileContents.split(/\r?\n/).forEach(line =>  {
    if(line.includes('GLY_ERROR (')){
      console.log(`Line from file: ${line}`);
    }
  });
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`)
}
function createWindow() {
      const directoryWindow = new BrowserWindow({
        width: 200,
        height: 100,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true,
      },
      });
      directoryWindow.loadFile(path.join(__dirname, 'render/html/inputDirectory.html'));
  
    }; 

// when app is ready, open a window
app.on( 'ready', () => {
    const win = openWindow();
    const mainMenu = Menu.buildFromTemplate(templateMenu);
    Menu.setApplicationMenu(mainMenu)
 
});

// when all windows are closed, quit the app
app.on( 'window-all-closed', () => {
    if( process.platform !== 'darwin' ) {
        app.quit();
    }
} );

const getDate = (dest) => {
  console.log("date")
}


// MENU
const templateMenu = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Selec LogRead folder',
          accelerator: 'Ctrl+F',
          click() {
            createNewProductWindow();
          }
        },
        {
          label: 'Remove All Products',
          click() {
            mainWindow.webContents.send('products:remove-all');
          }
        },
        {
          label: 'Exit',
          accelerator: process.platform == 'darwin' ? 'command+Q' : 'Ctrl+Q',
          click() {
            app.quit();
          }
        }
      ]
    }
  ];

  if (process.env.NODE_ENV !== 'production') {
    templateMenu.push({
      label: 'DevTools',
      submenu: [
        {
          label: 'Show/Hide Dev Tools',
          accelerator: process.platform == 'darwin' ? 'Comand+D' : 'Ctrl+D',
          click(item, focusedWindow) {
            focusedWindow.toggleDevTools();
          }
        },
        {
          role: 'reload'
        }
      ]
    })
  }