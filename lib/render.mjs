import { zip } from './base/array/array.mjs';

export function createStyleEngine(createElement) {
  const styleSheetElement = document.createElement('style');

  const getClassName = (styles) => {
    const styleSheet = styleSheetElement.sheet;
    const ruleId = styleSheet.cssRules.length;
    const className = `style_${ruleId}`;
    const ruleInitialDefition = `.${className} {}`;
    const ruleIndex = styleSheet.insertRule(ruleInitialDefition, ruleId);
    const rule = styleSheet.cssRules[ruleIndex];

    for (const [key, value] of Object.entries(styles)) {
      rule.style[key] = value;
    }

    return className;
  };

  return [styleSheetElement, getClassName];
}

export function createRenderInto(
    createElementImpl,
    createTextNode,
    getClassName,
) {
  let nextId = 0;

  function createElement(tagName, props = {}, children = []) {
    const { style, events = {}, attributes = {} } = props;
    const element = createElementImpl(tagName);

    for (const [eventName, handler] of Object.entries(events)) {
      element.addEventListener(eventName, handler);
    }

    for (const [key, value] of Object.entries(attributes)) {
      element[key] = value;
    }

    if (style) {
      element.classList.add(getClassName(style));
    }

    renderInto(element, children);

    return element;
  }

  function getNewId() {
    return nextId++;
  }

  function expandNode(it) {
    switch (it.type) {
      case 'fragment':
        return it.children;

      case 'component': {
        const { properties, children, component } = it;
        const library = { getClassName };
        return expandNode(component({ ...properties, children }, library));
      }

      default:
        return [it];
    }
  }

  function renderChild(vNode) {
    switch (vNode.type) {
      case 'element':
        return createElement(vNode.tagName, vNode.properties, vNode.children);

      case 'text':
        return createTextNode(vNode.body);

      case 'component':
      case 'fragment':
        throw new Error('should have been expanded');
    }
  }

  function updateElement(domNode, vNode) {
    throw new Error('not implemented');
  }

  function renderInto(parentElement, nodes) {
    const domArray = Array.from(parentElement.childNodes);
    const zipped = zip(domArray, nodes.flatMap(expandNode));

    zipped.forEach(([domNode, vNode], index) => {
      if (domNode == null) {
        const element = renderChild(vNode);
        parentElement.appendChild(element);
      }
      else if (vNode) {
        parentElement.removeChild(domNode);
      }
      else {
        updateElement(domNode, vNode);
      }
    });
  }

  return (parentElement, node) => renderInto(parentElement, [node]);
}

//
// type ElementProperties = {
//   style: Object<string, string>;
//   attributes: Object<string, string>;
//   events: Object<string, (...any) => any
// }
//
// type Nodes =
//   | { type: 'component', properties: any, children: Node[] }
//   | { type: 'element', properties: ElementProperties, children: Node[] }
//   | { type: 'text', body: string }
//   | { type: 'fragment', children: Nodes[] }
//

export function render(component, properties, rawChildren = undefined) {
  const children = rawChildren && rawChildren
      .map(it => typeof it === 'string' ? { type: 'text', body: it } : it)

  if (typeof component === 'string') {
    return {
      type: 'element',
      tagName: component,
      properties,
      children,
    };
  }

  return {
    type: 'component',
    component,
    properties,
    children,
  };
}

export function fragment(children) {
  return { type: 'fragment', children };
}
