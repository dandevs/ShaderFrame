We are making an AI powered image editor.

We need a professional, clean UI that can be toggled with light and dark theme, put reusable components into our "ui-library" folder.

I am thinking of something like we have a "Layer" (our resizable panel). "Everything" is a layer. Layers can have children layer in them.

We should be able to do drag and drop operations to put in images into a layer.
We could have something like layer

`[ Base Layer [ Image 1 ] [ Image 2 ] ]`

This is our important feature! We could click on Base Layer and type "Transition blend between images" into a small chatbox. This would:
  * Create a shader that applies to [ Base Layer ] and its children.
  * Creates variables that we can apply EG:
    * Transition position
    * Transition width
    * Transition direction

We'd have an inspector and a "component" that houses these variables that we can set. We'd need some serializable system and some UI that can handle a good solid amount of possible variable types. Think of the Unity3D inspector, we essentially want something like this.

The component would then have an "edit" button. this would open the a prompt chat, with the current prompt that was put in for the user to modify.

For now we want to just use openrouter API, be sure to write a way for easy extensibility for other libraries.

Implement a Home button, a "New Project" button. We should have a built in TEXT tool (that creates a layer that has text in it, powered by three.js so we can also apply stuff to it).

Take a look in the EditorTestBed folder for current implementation information!.

Importantly, always keep AGENTS.md up to date, and create new AGENTS.md in subdirectories that have notable complexity or navigation required to them.
