import { observer } from "mobx-react-lite";
import { EditorState } from "./EditorTestBed";

export const Inspector = observer((props: { state: EditorState }) => {
  const { canvas, scene, camera, renderer, selectedLayer, rootLayer } = props.state

  const layerSummary = (layer: import("./layer").Layer) => {
    return `children: ${layer.children.length}`
  }

  return (
    <h1>hello</h1>
  )
});
