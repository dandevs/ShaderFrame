import { observer } from 'mobx-react-lite'
import { useUIStore } from '@renderer/providers/StoreProvider'
import { EditorLayout } from '@renderer/components/EditorLayout'
import { HomeScreen } from '@renderer/components/HomeScreen'

/**
 * App — Root application component.
 *
 * Routes between HomeScreen and EditorLayout based on UIStore.showHomeScreen.
 */
const App = observer(function App(): React.JSX.Element {
  const uiStore = useUIStore()

  if (uiStore.showHomeScreen) {
    return <HomeScreen />
  }

  return <EditorLayout />
})

export default App
