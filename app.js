const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dateFormat = require('date-fns/format')
const parse = require('date-fns/parse')

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
    dueDate: dbObject.due_date,
  }
}

// api /todos/

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = ''} = request.query

  switch (true) {
    case hasStatusProperty(request.query):
      const {status} = request.query
      if (status === 'IN PROGRESS' || status === 'TO DO' || status === 'DONE') {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND status = "${status}";`
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriorityProperty(request.query):
      const {priority} = request.query
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND priority = "${priority}";`
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
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
      const {category} = request.query
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%"
            AND category = "${category}";`
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
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
  const parsedDate = parse(date, 'yyyy-MM-dd', new Date())

  if (isValid(parsedDate) === true) {
    let data = null

    const formattedDate = dateFormat(parsedDate, 'yyyy-MM-dd')
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

// api put todo

app.put('/todos/:todoId', async (request, response) => {
  let data = null
  let updateStatus = null
  let putTodosQuery = ''
  const {todoId} = request.params

  switch (true) {
    case hasStatusProperty(request.body):
      const updateStatusDetails = request.body
      const {status} = updateStatusDetails
      if (status === 'IN PROGRESS' || status === 'TO DO' || status === 'DONE') {
        putTodosQuery = `
            UPDATE todo
            SET
            status = '${status}'
            WHERE id = ${todoId};`
        updateStatus = 'Status Updated'
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case hasPriorityProperty(request.body):
      const updatePriorityDetails = request.body
      const {priority} = updatePriorityDetails
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        putTodosQuery = `
            UPDATE todo
            SET
            priority = '${priority}'
            WHERE id = ${todoId};`
        updateStatus = 'Priority Updated'
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCategoryProperty(request.body):
      const updateCategoryDetails = request.body
      const {category} = updateCategoryDetails
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        putTodosQuery = `
            UPDATE todo
            SET
            category = '${category}'
            WHERE id = ${todoId};`

        updateStatus = 'Category Updated'
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    default:
      putTodosQuery = `
            SELECT *
            FROM todo
            WHERE todo LIKE "%${search_q}%";`
      break
  }

  data = await db.run(putTodosQuery)
  response.send(updateStatus)
})

// api post todo

app.post('/todos/', async (request, response) => {
  const todoDetails = request.body

  const {id, todo, priority, status, category, dueDate} = todoDetails

  console.log(todoDetails)

  const postTodoQuery = `
    INSERT INTO todo (id, todo, priority, status, category, due_date) VALUES (
    ${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}'
    );
  `

  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

// api deleteTodo

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params

  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id = ${todoId};
  `
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
