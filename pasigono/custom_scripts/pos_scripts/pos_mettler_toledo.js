var port;
var textEncoder;
var weight = 0;
var weightLoop = false;
var portConnected = false;
var reader;
/*window.writer;
erpnext.PointOfSale.Toledo.connect = async function(){
	window.port = await navigator.serial.getPorts();
	await window.port.open({baudRate: 9600, dataBits: 7, parity: "even", stopBits: 1});
	receiveData();
	const textEncoder = new TextEncoderStream();
	textEncoder.readable.pipeTo(window.port.writable);
	window.writer = textEncoder.writable.getWriter();
	window.setInterval(getweight, 1000);
}

erpnext.PointOfSale.Toledo.getWeight = async function(){
	async function getweight(){
		// Prompt user to select any serial port.
		await window.writer.write("W");
	}
}*/

onmessage = function(message){
	if(message.data.command == "connect"){
		connectPort();
	}
    else if(message.data.command == "start")
    {
		weightLoop = true;
        startWeight();
    }
	else if(message.data.command == "stop"){
		weightLoop = false;
	}
}

async function connectPort(){
	var portFound = false;
    var ports = await navigator.serial.getPorts();
	textEncoder = new TextEncoderStream();
	if(ports.length > 0){
		
		port = ports[0];
		var stop = false;
		try{
			await port.open({baudRate: 9600, dataBits: 7, parity: "even", stopBits: 1});
			textEncoder.readable.pipeTo(port.writable);
			reader = port.readable.getReader();
			portConnected = true;
		}
		catch(error){
			//TODO: Catch connection errors
		}
	}
}

async function startWeight(){
	if(portConnected){
		try{
			var strWeight = "";
			await sendCommand("W");
		}catch(error){
			//TODO: Catch error if port already connected
		}
		while(port.readable){
			if(!weightLoop){
				break;
			}
			try{
				while(true){
					if(!weightLoop){
						break;
					}
					const {value, done} = await reader.read();
					if(done){
						//reader.releaseLock();
					}
					if(value){
						var [response, completed] = await decodeData(value);
						if(!completed){
							strWeight.concat(response);
						}
						else{
							//If all the result is returned in a single chunk
							if(strWeight == ""){
								strWeight = response;
							}
							else{
								strWeight.concat(response)
							}
							var newWeight = parseFloat(strWeight);
							if(newWeight != weight && !isNaN(newWeight)){
								weight = newWeight;
								postMessage({
									"message": "weight",
									"weight": weight
								});
							}
							setTimeout(async function(){
								//Wait for 500ms to give the weight device time to process result 
								//and give script time to accept new command
								strWeight = "";
								await sendCommand("W");
							}, 500);
						}
					}
				}
			}catch(error){
				//TODO: Catch errors relating to writing and reading from port
				console.log(error.message);
			} finally{
				//reader.releaseLock();
			}
		}
	}
	else{
		//TODO: Call function to connect device then read weight
	}
}

async function sendCommand(command){
	try{
		var writer = textEncoder.writable.getWriter();
		await writer.write(command);
		writer.releaseLock();
		//writer.close();
	}
	catch(error){
		console.log(error.message);
	}
}

async function decodeData(data){
	var str = "";
	var completed = false;
	for(var i = 0; i < data.byteLength; i++){
		//Check if the value is not the ASCII STR (Start of Text) character
		//Or is an ASCII cr indicating that the weight has been completely sent
		if(data[i] != 2){
			if(data[i] == 13){
				completed = true;
			}
			else{
				str = str.concat(String.fromCharCode(data[i]));
			}
		}
	}
	return [str, completed];
}

