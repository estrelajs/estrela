// import { coerceObservable, Subscription } from '../../observables';
// import { coerceArray } from '../../utils';
// import { domApi } from '../domapi';
// import { h } from '../h';
// import { patch } from '../virtual-dom/patch';
// import { VirtualNode } from '../virtual-dom/virtual-node';
// import { Hook } from './Hook';

// const subscriptonMap = new WeakMap<Node, Subscription>();
// const lastNodeMap = new WeakMap<Node, VirtualNode>();

// function hook(oldNode: VirtualNode, node?: VirtualNode): void {
//   const element = node?.element ?? oldNode.element;
//   if (!element || !domApi.isFragment(element)) {
//     return;
//   }

//   if (oldNode.observable !== node?.observable) {
//     subscriptonMap.get(element)?.unsubscribe();
//     subscriptonMap.delete(element);

//     if (node?.observable) {
//       // observe changes
//       const subscription = coerceObservable(node.observable).subscribe(
//         value => {
//           let lastNode = lastNodeMap.get(element);
//           const patchNode = h(null, null, ...coerceArray(value));
//           patchNode.element = element;

//           if (!patchNode.children?.length) {
//             setEmptyText(patchNode);
//           }

//           if (lastNode) {
//             lastNode = patch(lastNode, patchNode);
//           } else {
//             lastNode = patchNode;
//             patchNode.createElement();
//           }

//           lastNodeMap.set(element, lastNode);
//         },
//         { initialEmit: true }
//       );

//       if (!lastNodeMap.has(element)) {
//         const lastNode = h();
//         lastNode.element = element;
//         lastNodeMap.set(element, lastNode);
//         setEmptyText(lastNode);
//       }

//       // add subscription to the map
//       subscriptonMap.set(element, subscription);
//     } else {
//       const lastNode = lastNodeMap.get(element);
//       if (lastNode) {
//         oldNode.children = lastNode.children;
//       }
//     }
//   }
// }

// function setEmptyText(node: VirtualNode): void {
//   const text = h('#');
//   const element = text.createElement();
//   node.element?.appendChild(element);
//   node.children = [text];
// }

// export const observableHook: Hook = {
//   create: hook,
//   update: hook,
//   remove: hook,
// };
