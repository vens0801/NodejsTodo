const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dateFormat = require('date-fns/format')

const isValid = require('date-fns/isValid')

const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')

const app = express()
app.use(express.json())

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running')
    })
  } catch (error) {
    console.log(`DB Error : ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusAndPriorityProperty = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  )
}

const hasCategoryAndStatusProperty = requestQuery => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  )
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const hasCategoryAndPriorityProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const convertDbObjectToResponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dateFormat(new Date(dbObject.due_date), 'yyyy-MM-dd'),
  }
}

// api /todos/

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', category, status, priority} = request.query

  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND status = "${status}";`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND priority = "${priority}";`
      break
    case hasStatusAndPriorityProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND priority = "${priority}"
            AND status = "${status}";`
      break
    case hasCategoryProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND category = "${category}";`
      break
    case hasCategoryAndStatusProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND category = "${category}"
            AND status = "${status}";`
      break
    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND priority = "${priority}"
            AND category = "${category}";`
      break
    default:
      getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%";`
      break
  }

  data = await db.all(getTodosQuery)
  response.send(data.map(eachTodo => convertDbObjectToResponseObject(eachTodo)))
})

// api /todos/:todoId/

app.get('/todos/:todoId/', async (request, response) => {
  let data = null
  const {todoId} = request.params
  const getSpecificTodo = `
  SELECT * from
  todo
  WHERE id = ${todoId};
  `
  data = await db.get(getSpecificTodo)
  response.send(convertDbObjectToResponseObject(data))
})

// api /agenda/

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const formattedDate = dateFormat(new Date(date), 'yyyy-MM-dd')

  if (isValid(formattedDate) === true) {
    let data = null
    const getAgenda = `
      SELECT * FROM
      todo
      WHERE due_date = '${formattedDate}';`

    data = await db.all(getAgenda)
    response.send(
      data.map(eachAgenda => convertDbObjectToResponseObject(eachAgenda)),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})

// api post todo

app.post('/todos/', async (request, response) => {
  let data = null

  const todoDetails = request.body

  const {id, todo, priority, status, category, dueDate} = todoDetails

  const postTodoQuery = `
    INSERT INTO todo (todo, priority, status, category, due_date) VALUES (
    '${todo}', '${priority}', '${status}', '${category}', '${dueDate}'
    );
  `

  data = await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

// api deleteTodo

app.delete('/todos/:todoId', async (request, response) => {
  let data = null
  const {todoId} = request.params

  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId}
  `
  data = await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
