import { componentOnReady } from '@ionic/core/components';

import { OutletPageManager } from '../OutletPageManager';

jest.mock('@ionic/core/components', () => ({ componentOnReady: jest.fn() }));
jest.mock('../../components/inner-proxies', () => ({ IonRouterOutletInner: 'ion-router-outlet' }));

describe('OutletPageManager deferred hydration', () => {
  let callbacks: (() => void)[];
  let manager: OutletPageManager;
  let outlet: HTMLIonRouterOutletElement;
  let registerIonPage: jest.Mock;

  beforeEach(() => {
    callbacks = [];
    jest.mocked(componentOnReady).mockImplementation((_el, callback) => {
      callbacks.push(() => callback(_el));
    });
    outlet = document.createElement('ion-router-outlet');
    registerIonPage = jest.fn();
    manager = new OutletPageManager({ children: null, StackManager: () => null });
    manager.context = { registerIonPage, isInOutlet: () => true };
    manager.ionRouterOutlet = outlet;
  });

  it('ignores hydration after unmount even when the ref still exists', () => {
    manager.componentDidMount();
    manager.componentWillUnmount();
    callbacks[0]();
    expect(registerIonPage).not.toHaveBeenCalled();
    expect(manager.outletIsReady).toBe(false);
    expect(outlet.className).toBe('');
  });

  it('ignores hydration after the ref is cleared', () => {
    manager.componentDidMount();
    manager.ionRouterOutlet = undefined;
    expect(() => callbacks[0]()).not.toThrow();
    expect(registerIonPage).not.toHaveBeenCalled();
    expect(manager.outletIsReady).toBe(false);
  });

  it('does not initialize a replacement outlet from an old callback', () => {
    manager.componentDidMount();
    manager.ionRouterOutlet = document.createElement('ion-router-outlet');
    callbacks[0]();
    expect(registerIonPage).not.toHaveBeenCalled();
    expect(manager.ionRouterOutlet.className).toBe('');
    expect(manager.outletIsReady).toBe(false);
  });

  it('allows only the current mount to register during Strict Mode remounts', () => {
    manager.componentDidMount();
    manager.componentWillUnmount();
    manager.componentDidMount();
    callbacks[0]();
    expect(registerIonPage).not.toHaveBeenCalled();
    callbacks[1]();
    expect(registerIonPage).toHaveBeenCalledTimes(1);
    expect(registerIonPage).toHaveBeenCalledWith(outlet, undefined);
    expect(outlet.classList.contains('ion-page')).toBe(true);
    outlet.classList.remove('ion-page-invisible');
    callbacks[1]();
    expect(registerIonPage).toHaveBeenCalledTimes(1);
    expect(outlet.classList.contains('ion-page-invisible')).toBe(false);
  });
});
