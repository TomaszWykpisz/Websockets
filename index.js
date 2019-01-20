const Hapi=require('hapi');
const data = require('./data.js');

const server=Hapi.server({
    host:'localhost',
    port:8000
});


const io = require('socket.io')(server.listener);

const start =  async function() {
await server.register(require('inert'));
    
	server.route({
	    method:'GET',
	    path:'/',
	    handler:function(request,h) {
	    	return h.file('./index.html');
	    }
	});

	server.route({
	    method:'GET',
	    path:'/data',
	    handler:function(request,h) {
	    	return h.file('./data.html');
	    }
	});
    try {
        await server.start();
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }

    console.log('Server running at:', server.info.uri);
};

start();

io.on('connection', (socket) =>{
	socket.on('login', (login, pass) =>{
		var logged = false;

		for(var a = 0; a < data.kontrolerzy.length; a++){
			let kontroler = data.kontrolerzy[a];
			if(kontroler.login == login && kontroler.pass == pass){
				
				logged = true;
				socket.join(kontroler.id);
				io.to(kontroler.id).emit('logged', kontroler.id);

				var hasParking = false;
				for(var b = 0; b < data.parkingi.length; b++){
					let parking = data.parkingi[b];
					if(parking.idKontrolera == kontroler.id){

						hasParking = true;
						io.to(kontroler.id).emit('show parking', parking.id, parking.miejsca);
					}
				}
				if(!hasParking){
					socket.emit('err', 'Brak parkingów');
				}			
			}
		}
		if(!logged){
			socket.emit('err', 'Nie znaleziono użytkownika');
		}
	});
	socket.on('change data', (p, m, v) => {
		var parking = data.parkingi[p];
		parking.miejsca[m]['status'] = v;
		io.to(parking.idKontrolera).emit('show parking', parking.id, parking.miejsca);
	});
});