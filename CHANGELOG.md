# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.5] - Syncronous Directives - 2022/02/17
### Changed
- Directives now sync return their result.

## [0.5.4] - Class and Styles - 2022/02/17
### Added
- Added class attr support.
- Added style attr support.
- Added support for directives in tags too.

## [0.5.3] - Api Refactor - 2022/02/16
### Fixed
- Fixed bug on isInTag checker.

## [0.5.2] - Api Refactor - 2022/02/16
### Fixed
- Fixed bug on attr change listener.

## [0.5.1] - Api Refactor - 2022/02/16
### Changed
- Package build and publish logic.

## [0.5.0] - Api Refactor - 2022/02/16
### Changed
- No prop bind prefix anymore.
- Improved the directive api.

## [0.4.0] - Rollup config - 2022/02/14
### Changed
- Props have options argument only.

## [0.3.8] - Rollup config - 2022/02/07
### Fixed
- Fixed directives build.

## [0.3.7] - Skiped - 2022/02/07

## [0.3.6] - Skiped - 2022/02/07

## [0.3.5] - Skiped - 2022/02/07

## [0.3.4] - Skiped - 2022/02/07

## [0.3.3] - Rollup config - 2022/02/07
### Changed
- Moved directives build to "estrela/directives".

### Removed
- Dropped `requestRender` function.

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
