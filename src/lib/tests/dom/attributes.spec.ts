import { state } from '../../core';
import { buildDataFromAttributes } from '../../dom/builders/data-builder';

describe('buildAttributeData', () => {
  const empty = {
    attrs: {},
    binds: {},
    class: {},
    events: {},
    props: {},
    style: {},
    key: undefined,
    ref: undefined,
  };

  it('should get empty attribute data', () => {
    const tokens: unknown[] = [];
    const data = buildDataFromAttributes('', tokens);

    expect(data).toEqual(empty);
  });

  describe('class', () => {
    it('should get class', () => {
      const tokens: unknown[] = [];
      const data = buildDataFromAttributes('class="foo bar"', tokens);

      expect(data).toEqual({
        ...empty,
        class: {
          foo: true,
          bar: true,
        },
      });
    });

    it('should get class with bind', () => {
      const tokens: unknown[] = ['foo bar'];
      const data = buildDataFromAttributes('class="{{0}}"', tokens);

      expect(data).toEqual({
        ...empty,
        class: {
          foo: true,
          bar: true,
        },
      });
    });

    it('should get class with state bind', () => {
      const tokens: unknown[] = [state('foo bar')];
      const data = buildDataFromAttributes('class="{{0}}"', tokens);

      expect(data).toEqual({
        ...empty,
        class: {
          foo: true,
          bar: true,
        },
      });
    });

    it('should get accessed class', () => {
      const tokens: unknown[] = [true, state(false)];
      const data = buildDataFromAttributes(
        'class.foo="{{0}}" class.bar="{{1}}"',
        tokens
      );

      expect(data).toEqual({
        ...empty,
        class: {
          foo: true,
          bar: false,
        },
      });
    });

    it('should get class with object', () => {
      const tokens: unknown[] = [{ foo: true, bar: false, 'a b': state(true) }];
      const data = buildDataFromAttributes('class="{{0}}"', tokens);

      expect(data).toEqual({
        ...empty,
        class: {
          a: true,
          b: true,
          foo: true,
          bar: false,
        },
      });
    });
  });

  describe('style', () => {
    it('should get style', () => {
      const tokens: unknown[] = [];
      const data = buildDataFromAttributes('style="foo:1; bar:2;"', tokens);

      expect(data).toEqual({
        ...empty,
        style: {
          foo: '1',
          bar: '2',
        },
      });
    });

    it('should get accessed style', () => {
      const tokens: unknown[] = [1, state(2)];
      const data = buildDataFromAttributes(
        'style.foo="{{0}}" style.bar="{{1}}"',
        tokens
      );

      expect(data).toEqual({
        ...empty,
        style: {
          foo: '1',
          bar: '2',
        },
      });
    });

    it('should get accessed style with filter', () => {
      const tokens: unknown[] = [100];
      const data = buildDataFromAttributes(
        'style.max-width|px="{{0}}"',
        tokens
      );

      expect(data).toEqual({
        ...empty,
        style: {
          maxWidth: '100px',
        },
      });
    });

    it('should get object style', () => {
      const tokens: unknown[] = [
        {
          foo: 'bar',
          'bar|px': 100,
          'foo-bar': 'fooBar',
        },
      ];
      const data = buildDataFromAttributes('style="{{0}}"', tokens);

      expect(data).toEqual({
        ...empty,
        style: {
          foo: 'bar',
          bar: '100px',
          fooBar: 'fooBar',
        },
      });
    });
  });

  describe('events', () => {
    it('should get events', () => {
      const tokens: unknown[] = [() => {}, state()];
      const data = buildDataFromAttributes(
        'on:click="{{0}}" on:mouseover="{{1}}"',
        tokens
      );

      expect(data).toEqual({
        ...empty,
        events: {
          click: {
            accessor: undefined,
            filters: [],
            handler: tokens[0],
          },
          mouseover: {
            accessor: undefined,
            filters: [],
            handler: tokens[1],
          },
        },
      });
    });

    it('should get events modifiers', () => {
      const tokens: unknown[] = [() => {}];
      const data = buildDataFromAttributes(
        'on:keydown.page-down|prevent|once="{{0}}"',
        tokens
      );

      expect(data).toEqual({
        ...empty,
        events: {
          keydown: {
            accessor: 'pageDown',
            filters: ['prevent', 'once'],
            handler: tokens[0],
          },
        },
      });
    });
  });

  describe('binds', () => {
    it('should get binds', () => {
      const tokens: unknown[] = [state('foo'), state('bar')];
      const data = buildDataFromAttributes(
        'bind:foo="{{0}}" bind:bar="{{1}}"',
        tokens
      );

      expect(data).toEqual({
        ...empty,
        binds: {
          foo: tokens[0],
          bar: tokens[1],
        },
        props: {
          foo: 'foo',
          bar: 'bar',
        },
      });
    });

    it('should get default bind', () => {
      const tokens: unknown[] = [state('foo')];
      const data = buildDataFromAttributes('bind="{{0}}"', tokens);

      expect(data).toEqual({
        ...empty,
        binds: {
          bind: tokens[0],
        },
        props: {
          bind: 'foo',
        },
      });
    });
  });

  describe('defaults', () => {
    it('should get attrs', () => {
      const tokens: unknown[] = [state('foo'), state('bar')];
      const data = buildDataFromAttributes('foo="{{0}}" bar="{{1}}"', tokens);

      expect(data).toEqual({
        ...empty,
        attrs: {
          foo: 'foo',
          bar: 'bar',
        },
      });
    });

    it('should get props', () => {
      const tokens: unknown[] = [state('foo'), state('bar')];
      const data = buildDataFromAttributes(
        'foo="{{0}}" bar="{{1}}"',
        tokens,
        true
      );

      expect(data).toEqual({
        ...empty,
        props: {
          foo: 'foo',
          bar: 'bar',
        },
      });
    });
  });
});
