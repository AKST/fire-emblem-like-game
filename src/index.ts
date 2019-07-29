import { repeat } from 'base/array/array';
import {
  render,
  createRenderInto,
  createStyleEngine,
  VirtualNode,
} from 'render/core';

function Container({ grid }: { grid: VirtualNode }) {
  return (
    render('div', {
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        background: 'black',
      },
    }, [grid])
  );
}

function GridSlot({ className }: { className: string }): VirtualNode {
  console.log(className);
  return render('div', {
    attributes: { className },
  })
}

function Grid({ width, height }: { width: number, height: number }, lib: any) {
  const n = width * height;
  const whRatio = width / height;
  const [wUnits, hUnits] = width > height
      ? [100 * (width / height), 100]
      : [100, 100 * (height / width)];

  const border = '1px solid white';
  const slotClassName = lib.getClassName({
    boxSizing: 'border-box',
    borderTop: border,
    borderLeft: border,
  });

  return (
    render(
      'div',
      {
        style: {
          display: 'grid',
          width: `${wUnits}vmin`,
          height: `${hUnits}vmin`,
          boxSizing: 'border-box',
          borderRight: border,
          borderBottom: border,
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
        },
      },
      repeat(n, () => (
        render(GridSlot, { className: slotClassName })
      )),
    )
  )
};

window.addEventListener('DOMContentLoaded', () => {
  try {
    const createElementImpl = (el: string) => document.createElement(el);
    const createTextImpl = (el: string) => document.createTextNode(el);

    const [
      styleSheetElement,
      getClassName,
    ] = createStyleEngine(createElementImpl);

    const renderInto = createRenderInto(
        createElementImpl,
        createTextImpl,
        getClassName,
    );

    const root = document.createElement('div');
    document.head.appendChild(styleSheetElement);
    document.body.appendChild(root);

    renderInto(root,
      render(Container, {
        grid: render(Grid, { width: 15, height: 10 }),
      }),
    );
  } catch (e) {
    console.error(e);
  }
});
