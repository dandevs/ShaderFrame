import { observer } from "mobx-react-lite";
import { EditorState } from "./EditorTestBed";

export const Inspector = observer((props: { state: EditorState }) => {
  const { canvas, scene, camera, renderer, selectedLayer, rootLayer } = props.state

  return (
    <div
      style={{
        width: '240px',
        flexShrink: 0,
        height: '100%',
        background: '#1a1a1a',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h1>HELLO WORLD</h1>
    </div>
  )
});
