import { zip } from 'base/array/array';

type CreateElement = Document['createElement'];
type Styles = Record<string, string>;
type Attributes = Record<string, any>;
type Events = Record<string, (...args: any) => any>;
type GetClassName = (styles: Styles) => string;

export function createStyleEngine(
    createElement: CreateElement,
): [HTMLStyleElement, GetClassName] {
  const styleSheetElement = document.createElement('style');

  const getClassName = (styles: Styles): string => {
    const styleSheet = styleSheetElement.sheet as any;
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

export type ElementProperties = {
  style?: Styles;
  attributes?: Attributes;
  events?: Events;
}

export type Component<P> = (props: P, library: any) => VirtualNode | undefined;

type ElementNode =
  | { type: 'element',
      tagName: string,
      properties: ElementProperties,
      children: readonly VirtualNode[] }

type ComponentNode<P> =
  | { type: 'component',
      properties: P,
      component: Component<P>,
      output?: VirtualNode }

export type VirtualNode =
  | { type: 'text', body: string }
  | { type: 'fragment',
      children: readonly VirtualNode[] }
  | ElementNode
  | ComponentNode<any>;

export function createElementFactory(
    createElementImpl: CreateElement,
    renderInto: (el: Element, children: readonly VirtualNode[]) => void,
    getClassName: GetClassName,
) {
  return function createElement(
      tagName: string,
      props: ElementProperties = {},
      children: readonly VirtualNode[] = [],
  ) {
    const { style, events = {}, attributes = {} } = props;
    const element = createElementImpl(tagName);

    for (const [eventName, handler] of Object.entries(events)) {
      element.addEventListener(eventName, handler);
    }

    for (const [key, value] of Object.entries(attributes)) {
      (element as any)[key] = value;
    }

    if (style) {
      element.classList.add(getClassName(style));
    }

    renderInto(element, children);

    return element;
  }
}

export function createRenderInto(
    createElementImpl: CreateElement,
    createTextNode: (tagName: string) => Text,
    getClassName: GetClassName,
) {
  let nextId = 0;

  const createElement = createElementFactory(
    createElementImpl,
    renderInto,
    getClassName,
  );

  function getNewId() {
    return nextId++;
  }

  function expandNode(it: VirtualNode): readonly VirtualNode[] {
    switch (it.type) {
      case 'fragment':
        return it.children;

      case 'component': {
        const { properties, component } = it;
        const library = { getClassName };
        return expandNode(component(properties, library));
      }

      default:
        return [it];
    }
  }

  function renderChild(vNode: VirtualNode): Node {
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

  function updateElement(domNode: Node, vNode: VirtualNode) {
    throw new Error('not implemented');
  }

  function renderInto(parentElement: Element, nodes: readonly VirtualNode[]) {
    const domArray = Array.from(parentElement.childNodes);
    const zipped: [Node, VirtualNode][] = zip(domArray, nodes.flatMap(expandNode));

    zipped.forEach(([domNode, vNode], index) => {
      if (domNode == null && vNode != null) {
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

  return (parentElement: Element, node: VirtualNode) => renderInto(parentElement, [node]);
}

type RawChildren = readonly (VirtualNode | string)[]
type RenderArgs<P> =
  | [Component<P>, P]
  | [string, ElementProperties]
  | [string, ElementProperties, RawChildren | undefined];

export function render<P>(...args: RenderArgs<P>): ElementNode | ComponentNode<P> {
  if (typeof args[0] === 'string') {
    const [component, properties, rawChildren = []] = args;
    const elementNode: ElementNode = {
      type: 'element',
      tagName: component,
      properties,
      children: rawChildren.map(
        (it): VirtualNode => typeof it === 'string' ? { type: 'text', body: it } : it
      ),
    };

    return elementNode;
  } else {
    const [component, properties] = args;
    const componentNode: ComponentNode<P> = {
      type: 'component',
      component,
      properties: properties as P,
    };

    return componentNode;
  }
}

export function fragment(children: readonly VirtualNode[]): VirtualNode {
  return { type: 'fragment', children };
}
