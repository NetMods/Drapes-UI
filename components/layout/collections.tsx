'use client'
import { StarIcon } from "@phosphor-icons/react/dist/ssr"
import { useSidebar } from "../ui/sidebar";

export const Collections = () => {
  const backgrounds = [
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } },
    { name: 'Radial Dots', component: <span className="p-3"></span>, code: { js: "", ts: "" } }
  ]

  const { openSidebar } = useSidebar()
  const handleShowCode = (item: any) => {
    openSidebar({
      name: item.name,
      usage: `
import { Sexiest } from '@/components/sex.tsx'
      
export default function Page() {
  return (
    <div className='min-h-screen bg-white'>
      <Sexiest />
    </div>
  )
}
      `,
      js: `
import { useState } from "react";

export default function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState("");

  function addTodo() {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, done: false }]);
    setInput("");
  }

  function toggleDone(id) {
    setTodos(
      todos.map(todo =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  }

  return (
    <div>
      <h2>Todo App</h2>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>

      <ul>
        {todos.map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleDone(todo.id)}
            style={{ textDecoration: todo.done ? "line-through" : "none" }}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
`,
      ts: `
import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");

  function addTodo(): void {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now(), text: input, done: false }]);
    setInput("");
  }

  function toggleDone(id: number): void {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, done: !todo.done } : todo
      )
    );
  }

  return (
    <div>
      <h2>Todo App</h2>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={addTodo}>Add</button>

      <ul>
        {todos.map(todo => (
          <li
            key={todo.id}
            onClick={() => toggleDone(todo.id)}
            style={{ textDecoration: todo.done ? "line-through" : "none" }}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
`
    });
  };

  return (
    <div className="flex flex-col items-center text-base-content w-full mb-5">
      <span className="text-4xl font-serif">Our Collections</span>
      <div className="w-full grid max-sm:grid-cols-1 grid-cols-2 xl:grid-cols-3 mt-5 gap-5 wrap-break-word md:px-10">
        {backgrounds.map((item, index) => (
          <div
            className={`relative w-full h-96 overflow-hidden ${index % 2 === 0 ? 'justify-self-end' : 'justify-self-start'}`}
            key={index}
          >
            <div className={`size-full bg-base-content/20 rounded-2xl group border border-white/20`} >
              {item.component}
              <div className="group-hover:-translate-y-28 p-2 border-t border-white/20 w-full transition-all ease-out absolute top-100">
                <span className="font-serif text-3xl italic">{item.name}</span>
                <div className="pt-2 space-x-2">
                  <button className="inline-flex px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear">
                    Preview
                  </button>
                  <button
                    className="inline-flex px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear"
                    onClick={() => handleShowCode(item)}
                  >
                    Code
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 m-2 p-2 rounded-xl cursor-pointer bg-base-content/20 group">
              <StarIcon className="group-hover:text-yellow-500 transition-colors ease-linear" weight="fill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
