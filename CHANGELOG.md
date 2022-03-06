# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - Element Helpers - 2022/02/06
### Added
- Global onEvent function to create event observables.
- Global requestRender function.

## [0.3.1] - Props and Emitters - 2022/02/05
### Fixed
- Fixed regex key getter for stackblitz.

## [0.3.0] - Props and Emitters - 2022/02/05
### Added
- `prop()` directive.

### Changed
- Prop and emitters key can be bound automatically using `prop` or `emitter` directives.
- Still need to call `setProperties()` if the final build is going to be minified.

## [0.2.2] - Hotfix - 2022/02/05
### Fixed
- Missing separator key for Array.join.

## [0.2.1] - Hotfix - 2022/02/04
### Fixed
- Fixed arg function unecessary calls.

## [0.2.0] - Directives - 2022/02/03
### Added
- Experimental template directives.
- AsyncMap directive.
- AsyncRender directive.
- SwitchRender directive.
- When directive.

## [0.1.1] - First Release - 2022/02/01
### Added
- Functional Element support.
- Adopted Style Sheet support.
- `StateSubject` states support.
- `setProperties` to define props, states and else.
- Other features.
