import { state } from '../../core';
import { buildAttributeData } from '../../dom/builders/attribute-builder';

describe('buildAttributeData', () => {
  it('should get empty attribute data', () => {
    const tokens: unknown[] = [];
    const data = buildAttributeData('', tokens);

    expect(data).toEqual({
      attrs: {},
      class: {},
      props: {},
      style: {},
      key: undefined,
      ref: undefined,
    });
  });

  describe('class', () => {
    it('should get class', () => {
      const tokens: unknown[] = [];
      const data = buildAttributeData('class="foo bar"', tokens);

      expect(data).toEqual({
        attrs: {},
        class: {
          foo: true,
          bar: true,
        },
        props: {},
        style: {},
        key: undefined,
        ref: undefined,
      });
    });

    it('should get class with bind', () => {
      const tokens: unknown[] = ['foo bar'];
      const data = buildAttributeData('class="{{0}}"', tokens);

      expect(data).toEqual({
        attrs: {},
        class: {
          foo: true,
          bar: true,
        },
        props: {},
        style: {},
        key: undefined,
        ref: undefined,
      });
    });

    it('should get class with state bind', () => {
      const tokens: unknown[] = [state('foo bar')];
      const data = buildAttributeData('class="{{0}}"', tokens);

      expect(data).toEqual({
        attrs: {},
        class: {
          foo: true,
          bar: true,
        },
        props: {},
        style: {},
        key: undefined,
        ref: undefined,
      });
    });

    it('should get accessed class', () => {
      const tokens: unknown[] = [true, state(false)];
      const data = buildAttributeData(
        'class.foo="{{0}}" class.bar="{{1}}"',
        tokens
      );

      expect(data).toEqual({
        attrs: {},
        class: {
          foo: true,
          bar: false,
        },
        props: {},
        style: {},
        key: undefined,
        ref: undefined,
      });
    });

    it('should get class with object', () => {
      const tokens: unknown[] = [{ foo: true, bar: false, 'a b': state(true) }];
      const data = buildAttributeData('class="{{0}}"', tokens);

      expect(data).toEqual({
        attrs: {},
        class: {
          a: true,
          b: true,
          foo: true,
          bar: false,
        },
        props: {},
        style: {},
        key: undefined,
        ref: undefined,
      });
    });
  });

  describe('style', () => {
    it('should get style', () => {
      const tokens: unknown[] = [];
      const data = buildAttributeData('style="foo:1; bar:2;"', tokens);

      expect(data).toEqual({
        attrs: {},
        class: {},
        props: {},
        style: {
          foo: '1',
          bar: '2',
        },
        key: undefined,
        ref: undefined,
      });
    });

    it('should get accessed style', () => {
      const tokens: unknown[] = [1, state(2)];
      const data = buildAttributeData(
        'style.foo="{{0}}" style.bar="{{1}}"',
        tokens
      );

      expect(data).toEqual({
        attrs: {},
        class: {},
        props: {},
        style: {
          foo: '1',
          bar: '2',
        },
        key: undefined,
        ref: undefined,
      });
    });

    it('should get accessed style with filter', () => {
      const tokens: unknown[] = [100];
      const data = buildAttributeData('style.max-width|px="{{0}}"', tokens);

      expect(data).toEqual({
        attrs: {},
        class: {},
        props: {},
        style: {
          maxWidth: '100px',
        },
        key: undefined,
        ref: undefined,
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
      const data = buildAttributeData('style="{{0}}"', tokens);

      expect(data).toEqual({
        attrs: {},
        class: {},
        props: {},
        style: {
          foo: 'bar',
          bar: '100px',
          fooBar: 'fooBar',
        },
        key: undefined,
        ref: undefined,
      });
    });
  });
});
