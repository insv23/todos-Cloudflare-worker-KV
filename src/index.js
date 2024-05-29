/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const html = todos => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Todos</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss/dist/tailwind.min.css" rel="stylesheet">
  </head>
  <body class="bg-blue-100">
  	<div class="w-full h-full flex content-center justify-center mt-8">
  		<div class="bg-white shadow-md rounded px-8 pt-6 py-8 mb-4">
				<h1 class="block text-grey-800 text-md font-bold mb-2">Todos</h1>
				<div class="flex">
					<input class="shadow appearance-none border rounded w-full py-2 px-3 text-grey-800 leading-tight focus:outline-none focus:shadow-outline" type="text" name="name" placeholder="A new todo">
					<button class="bg-blue-500 hover:bg-blue-800 text-white font-bold ml-2 py-2 px-4 rounded focus:outline-none focus:shadow-outline" id="create">Create</button>
				</div>
				 <div class="mt-4" id="todos"></div>
  		</div>
  	</div>
  </body>
  <script>
		window.todos = ${todos};

		const updateTodos = function() {
			fetch('/', {method: 'PUT', body: JSON.stringify({todos: window.todos})});
			populateTodos();
		};

		const toggleCheckbox = function(evt) {
			const checkbox = evt.target;
			const todoElement = checkbox.parentElement;

			const newTodos = Array.from(window.todos);
			const todoId = Number(todoElement.dataset.todo);
			const todo = newTodos.find(t => t.id === todoId);

			if (todo) {
				todo.completed = !todo.completed;
				window.todos = newTodos;
				updateTodos();
			} else {
				console.error('Todo with {todoId} not found');
			}
		};

    const populateTodos = function() {
    	const todoContainer = document.querySelector('#todos');
			todoContainer.innerHTML = '';
    	window.todos.forEach(todo => {
        const el = document.createElement('div');
        el.className = "border-t py-4"
        el.dataset.todo = todo.id;

				const name = document.createElement('span');
				name.className = todo.completed ? "line-through" : ""
				name.textContent = todo.name;

				const checkbox = document.createElement('input');
				checkbox.className = "mx-4"
				checkbox.type = 'checkbox';
				checkbox.checked = !!todo.completed;
				checkbox.addEventListener('click', toggleCheckbox);

				el.appendChild(checkbox);
        el.appendChild(name);
        todoContainer.appendChild(el);
    	});
    };

    populateTodos();


    const createTodo = function() {
    	const input = document.querySelector('input[name=name]');
    	if (input.value.length > 0) {
    		window.todos = [].concat(window.todos, {
    			id: todos.length + 1,
    			name: input.value,
    			completed: false
    		});
    		fetch('/', {
    			method: 'PUT',
    			body: JSON.stringify({todos: todos})
    		});
				populateTodos();
				input.value = '';
    	}
    };

    document.querySelector('#create').addEventListener('click', createTodo);
  </script>
</html>
`;

export default {
	async fetch(request, env, ctx) {
		const defaultData = {
			todos: [
				{
					id: 1,
					name: 'Finish the Cloudflare Workers blog post',
					completed: false
				}
			]
		};

		const setCache = data => env.TODOS.put('data', data);
		const getCache = () => env.TODOS.get('data');

		if (request.method === 'PUT') {
			const body = await request.text();
			try {
				JSON.parse(body)
				await setCache(body)
				return new Response(body, {status: 200})
			} catch (err) {
				return new Response(err, {status: 500})
			}
		}

		let data;
		const cache = await getCache();
		if (!cache) {
			await setCache(JSON.stringify(defaultData));
			data = defaultData;
		} else {
			data = JSON.parse(cache);
		}

		// /</g是一个正则表达式，用于匹配所有的"<"字符，\\u003c是Unicode转义序列，表示"<"字符。
		// 通过这种方式，代码确保生成的JSON字符串中不包含"<"字符
		const body = html(JSON.stringify(data.todos).replace(/</g, '\\u003c'));
		return new Response(body, {
			headers: {
				'content-type': 'text/html'
			}
		});
	}
};
