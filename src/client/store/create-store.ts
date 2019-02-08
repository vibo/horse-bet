import { createStore, applyMiddleware } from 'redux'
import { routerMiddleware, connectRouter } from 'connected-react-router'
import { createLogger } from 'redux-logger'
import thunkMiddleware from 'redux-thunk'
import { History } from 'history'
import { endpoints } from 'utils/endpoints'
import { mockEndpoints } from 'utils/mock-endpoints'
import { rootReducer } from './reducers'

declare let module: { hot: any }

export default function configureStore(history: History) {
  const middleware = [
    routerMiddleware(history),
    thunkMiddleware.withExtraArgument(
      process.env.USE_MOCK ? mockEndpoints : endpoints
    )
  ]

  if (process.env.NODE_ENV !== 'production') {
    middleware.push(createLogger())
  }

  const store = createStore(
    connectRouter(history)(rootReducer),
    applyMiddleware(...middleware)
  )

  if (module.hot) {
    module.hot.accept('./index.ts', () => {
      const { rootReducer: nextRootReducer } = require('./index.ts')
      store.replaceReducer(nextRootReducer)
    })
  }

  return store
}
