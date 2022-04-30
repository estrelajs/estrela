export function render(node: JSX.Element, parent: Element): void {
  const element = node.createElement();
  parent.appendChild(element);
}
