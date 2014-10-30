var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
//var mongoose = require("mongoose");
//var expressSession = require("express-session");
//var MongoStore = require('connect-mongo')(expressSession);
var fs = require('fs');
var EventEmitter = require("events").EventEmitter;

var routes = require('./routes/routes.js');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(expressSession({secret: credentials.sessionSecret, resave: false, saveUninitialized: true, store: new MongoStore({url: connectionString})}));
app.use(express.static(path.join(__dirname, 'public')));

for (var route in routes)
{
	var controllerFile = '/routes/' + route + '.js';
	var hasController = fs.existsSync(__dirname + controllerFile);
	if (hasController)
	{
		var path = routes[route];
		var hasView = fs.existsSync(__dirname + '/views/' + route + '.ejs');
		var controller = require('.' + controllerFile);
		var load = controller.load;
		var events = controller.events;
		(function(path,load,route){//capture path,load,route with closure
			if (hasView)
			{
				app.get(path, function(req, res, next)
				{
					var env = load(req, res, next);
					res.render(route, env);
				});
			}
			else app.get(path, load);
		})(path,load,route);
		if (events)
		{
			var emitter = new EventEmitter();
			for (var name in events)
			{
				emitter.on(name, events[name]);
			}
			(function(emitter){//capture emitter with closure
				app.post((path != "/" ? path : "") + "/:event?", function(req, res, next)
				{
					var eventName = req.query.event;
					emitter.emit(eventName, req, res, next);
				});
			})(emitter);
		}
	}
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: 'error'
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
    });
});

module.exports = app;
