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

var pageEvents = {}
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
		(function(){
			var _path = path;
			var _load = load;
			var _route = route;
			if (hasView)
			{
				app.get(_path, function(req, res, next)
				{
					var env = _load(req, res, next);
					res.render(_route, env);
				});
			}
			else app.get(_path, _load);
		})();
		if (events)
		{
			var emitter = new EventEmitter();
			for (var name in events)
			{
				emitter.on(name, events[name]);
				app.post("/:event?", function(req, res, next)
				{
					var eventName = req.query.event;
					if (eventName)
					{
						emitter.emit(eventName, req, res, next);
					}
					else
					{
						var err = new Error("Unhandled POST request");
						err.status = 404;
						next(err);
					}
				});
			}
			pageEvents[route] = emitter;
		}
	}
}
app.pageEvents = pageEvents;

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
