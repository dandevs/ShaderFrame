import type { ShaderGenerationContext } from '@renderer/types/ai'

/** Build the system prompt that instructs the AI to generate GLSL shaders with uniform declarations */
export function buildShaderSystemPrompt(): string {
  return `You are a GLSL shader expert for a WebGL image editor. You generate fragment and vertex shaders that run in Three.js.

RESPONSE FORMAT:
You MUST respond with a JSON object in this exact format (no markdown, no code fences, just raw JSON):

{
  "name": "Descriptive Shader Name",
  "vertexShader": "... GLSL vertex shader code ...",
  "fragmentShader": "... GLSL fragment shader code ...",
  "uniforms": [
    {
      "name": "Display Name",
      "uniformName": "uVariableName",
      "type": "float|int|vec2|vec3|vec4|color|bool|enum",
      "value": <default_value>,
      "defaultValue": <default_value>,
      "min": 0.0,
      "max": 1.0,
      "step": 0.01,
      "description": "What this uniform controls"
    }
  ]
}

VERTEX SHADER RULES:
- Must declare: varying vec2 vUv;
- Must pass UV coordinates: vUv = uv;
- Use standard Three.js vertex transformation: gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

FRAGMENT SHADER RULES:
- Must declare: varying vec2 vUv;
- Always include uniform float uOpacity; (master opacity control)
- For image effects: use uniform sampler2D uTexture; (main texture)
- For multi-image: use uniform sampler2D uTexture0; uTexture1; etc.
- Output to gl_FragColor

UNIFORM TYPE RULES:
- "float": value is a number, include min, max, step
- "int": value is an integer, include min, max, step (step=1)
- "vec2": value is [x, y] array of numbers
- "vec3": value is [x, y, z] array of numbers
- "vec4": value is [x, y, z, w] array of numbers
- "color": value is a hex string like "#ff0000"
- "bool": value is true or false
- "enum": value is a string, include "options" array of valid strings

IMPORTANT:
- Always include meaningful uniforms the user can adjust
- Keep shaders performant (avoid heavy loops)
- Use proper GLSL syntax for WebGL 1.0 (no #version directive)
- All uniform names must start with "u" prefix (e.g., uBlendFactor)`
}

/** Build the user prompt enriched with shader generation context */
export function buildShaderUserPrompt(prompt: string, context?: ShaderGenerationContext): string {
  let userPrompt = prompt

  if (context) {
    const contextParts: string[] = []

    if (context.imageCount > 0) {
      contextParts.push(`This layer group contains ${context.imageCount} image(s).`)
    }

    if (context.childLayerNames.length > 0) {
      contextParts.push(`Child layers: ${context.childLayerNames.join(', ')}.`)
    }

    if (context.existingShader) {
      contextParts.push(`\n\nEXISTING SHADER TO MODIFY:\n${context.existingShader}`)
    }

    if (context.previousPrompt) {
      contextParts.push(`\nPREVIOUS PROMPT: "${context.previousPrompt}"`)
      contextParts.push(
        `\nThe user wants to modify the shader. Apply the new instructions while preserving the overall structure.`
      )
    }

    if (contextParts.length > 0) {
      userPrompt = `${contextParts.join('\n')}\n\nUSER REQUEST: ${prompt}`
    }
  }

  return userPrompt
}
