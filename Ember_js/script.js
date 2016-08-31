var TAG = "DEBUG";

Todos = Ember.Application.create({
	//LOG_TRANSITIONS: true,
	LOG_BINDINGS: true,
	LOG_VIEW_LOOKUPS: true,
	LOG_STACKTRACE_ON_DEPRECATION: true,
	LOG_VERSION: true,
	debugMode: true
});

Todos.ApplicationAdapter = DS.LSAdapter.extend();

Todos.Router.map(function () {
	this.route('todos', { path: '/' }, function () {
		this.route('active');
		this.route('completed');
	});
});

Todos.TodosRoute = Ember.Route.extend({
	model: function (params) {
		this.store.findAll('todo',{reload:true}).then(function(todos){
			Ember.Logger.debug(TAG,todos.getEach('title'));
			return todos;
		});
		//return this.store.find('todo');
	}
});

Todos.TodosIndexRoute = Ember.Route.extend({
	model: function (params) {
		Ember.Logger.debug(TAG, this.store.modelFor('todo'));
		Ember.Logger.debug(TAG, this.modelFor('todos'));
		return this.store.modelFor('todo');
	}
		//return this.modelFor('todos');
});

Todos.TodosActiveRoute = Ember.Route.extend({
	model: function(){
		return this.store.filter('todo', function (todo) {
			return !todo.get('isCompleted');
		});
	},
	renderTemplate: function(controller){
		this.render('todos/index', {controller: controller});
	}
});

Todos.TodosCompletedRoute = Ember.Route.extend({
	model: function(){
		return this.store.filter('todo', function (todo) {
			return todo.get('isCompleted');
		});
	},
	renderTemplate: function(controller){
		this.render('todos/index', {controller: controller});
	}
});

Todos.Todo = DS.Model.extend({
	title: DS.attr('string'),
	isCompleted: DS.attr('boolean')
});

Todos.Todo.FIXTURES= [
	{
		id: 1,
		title: 'Learn Ember.js',
		isCompleted: true
	},
	{
		id: 2,
		title: '...',
		isCompleted: false
	},
	{
		id: 3,
		title: 'Profit!',
		isCompleted: false
	}
];

Todos.TodoController = Ember.Controller.extend({
	actions: {
		editTodo: function () {
			this.set('isEditing', true);
		},
		acceptChanges: function () {
			this.set('isEditing', false);

			if (Ember.isEmpty(this.get('model.title'))) {
				Ember.run.debounce(this,'send','removeTodo',100);
				//this.send('removeTodo');
			} else {
				this.get('model').save();
			}
		},
		removeTodo: function () {
			var todo = this.get('model');
			todo.deleteRecord();
			todo.save();
		}
	},

	isEditing: false,

	isCompleted: function(key, value){
		var model = this.get('model');

		if (value === undefined) {
			// property being used as a getter
			return model.get('isCompleted');
		} else {
			// property being used as  setter
			model.set('isCompleted', value);
		model.save();
		return value;
		}
	}.property('model.isCompleted')
});

Todos.TodosController = Ember.Controller.extend({
	actions: {
		createTodo: function () {
			var title = this.get('newTitle');
			if (!title.trim()) {return;}

			var todo = this.get('store').createRecord('Todo', {
				title: title,
				isCompleted: false
			});

			this.set('newTitle', '');

			todo.save();
			Ember.Logger.debug("New title:",todo.get('title'));
		},

		clearCompleted: function () {
			var completed = this.filterProperty('isCompleted', true);
			completed.invoke('deleteRecord');
			completed.invoke('save');
		}
	},

	remaining: function () {
	/*
		this.store.filter('todo',function(todo){
			Ember.Logger.debug(todo.get('title').toString());
			todo.store.deleteRecord(todo);
			todo.destroyRecord().then(function(){
				this.store.pushPayload();
				this.model.transitionTo('loaded.saved');
			});
		});
	*/
		var a = 0;
		this.store.filter('todo', function (todo) {
			if (todo.get('isCompleted')==false){
				a++;
			}
		});
		Ember.Logger.debug(TAG,"items left:", a);
		return a;
	}.property('@each.isCompleted'),

	inflection: function () {
		var remaining = this.get('remaining');
		return remaining === 1 ? 'item' : 'items';
	}.property('remaining'),

	hasCompleted: function () {
		return this.get('completed') > 0;
	}.property('completed'),

	completed: function () {
		var a = 0;
		this.store.filter('todo', function (todo) {
			if (todo.get('isCompleted')==true){
				a++;
			}
		});
		Ember.Logger.debug(TAG,"completed:", a);
		return a;
		//this.filterBy('isCompleted', true).get('length');
	}.property('@each.isCompleted'),

	allAreDone: function (key, value) {
		if (value === undefined) {
			return !!this.get('length') && this.everyProperty('isCompleted', true);
		} else {
			this.setEach('isCompleted', value);
			this.invoke('save');
			return value;
		}
	}.property('@each.isCompleted'),
});

Todos.EditTodoView = Ember.TextField.extend({
	didInsertElement: function () {
	this.$().focus();
	}
});

Ember.Helper.helper('edit-todo', Todos.EditTodoView);

/*
Todo.DeleteAll = deleteTodo(id) {
	this.get('store').findRecord('todo', id).then((todo) => { 
		return todo.destroyRecord();
	}).then(() => {
		self.transitionToRoute('todos');
	});
}
*/
