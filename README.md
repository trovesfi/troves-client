<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<div align="center" style="margin-top:50px">
  <img src="https://avatars.githubusercontent.com/u/165751591?s=200&v=4" height="150">
</div>
<!-- markdownlint-restore -->
<!-- prettier-ignore-end --> 

# STRKFarm

STRKFarm is a platform that allows users to better navigate DeFi on Starknet. It has the following features:  
1. Show top yield generating pools sorted by Protocols and various Categories. 10+ Protocols are integrated. ✅
2. Customized strategies, providing one-click investment with automated risk-management ✅ (Adding more)
3. Concentrated Liquidity Impermanent calculator 🚧
4. One click $STRK claim for DeFi spring users 🚧

## Project structure
The project is build using NextJS and Typescript. Below is the broad project structure:  
1. Re-usable project wide components go into `src/components`. Page specific components go into their respective folder. (e.g. `src/app/claims/components`)
2. We use [Jotai](https://jotai.org/) for state management. Atoms are written in `src/store`. E.g. `src/store/strategies.atoms.ts`.
   Most re-usable data is written into atoms, outside components so that data is eaily accessible across components without dumping custom logic into components.
   Its suggested to keep view components low on business logic code.
3. All protocols have a class object (e.g. `src/store/ekubo.store.ts`). Where protocol specific custom logic is written, so that its get written to respective Atoms.
4. You can use `src/store/IDapp.store.ts` to define abstract class or type definitions that can be used within protocol class objects.
5. Custom re-usable hooks are written to `src/hooks`.

## How to get started

[![Pull Requests welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](https://github.com/strkfarm/starkfarm-client/issues)
Requirements:
1. Node 20+

Clone the repository
```bash
git clone https://github.com/strkfarm/starkfarm-client.git
```

Configure the environment. Ensure env file has necessary settings.
```
cp .env.sample .env.local
```

Install dependencies and run the development build

```bash
yarn
yarn run dev
```

You should see something like this:

```sh
> starknet-id-website@0.1.0 dev
> next dev

   ▲ Next.js 14.1.0
   - Local:        http://localhost:3000
   - Environments: .env

 ✓ Ready in 1431ms
```

## 🤝 Contribute


We're always looking for for stallions with great NextJS & Typescript skills to further this tool, to join our community and contribute to STRKFarm. Check out our [contributing guide](./CONTRIBUTING.md)
for more information on how to get started.

To connect with us regarding any queries about contributing to the repo, feel free to join our telegram group [here](https://t.me/+HQ_eHaXmF-1lZDc1). Head to `dev` topic.


## References

- [Telegram](https://t.me/+HQ_eHaXmF-1lZDc1)
- [OnlyDust](https://app.onlydust.com/p/strkfarm)
- [Website](https://www.strkfarm.xyz/)

## Contributors ✨
Thanks goes to these wonderful people.

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/akiraonstarknet"><img src="https://avatars.githubusercontent.com/u/156126180?v=4?s=100" width="100px;" alt="Akira "/><br /><sub><b>Akira </b></sub></a><br /><a href="#ideas-akiraonstarknet" title="Ideas, Planning, & Feedback">🤔</a> <a href="#code-akiraonstarknet" title="Code">💻</a> <a href="#infra-akiraonstarknet" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hemant.lol"><img src="https://avatars.githubusercontent.com/u/85151171?v=4?s=100" width="100px;" alt="Hemant"/><br /><sub><b>Hemant</b></sub></a><br /><a href="#infra-hemantwasthere" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/raizo07"><img src="https://avatars.githubusercontent.com/u/81079370?v=4?s=100" width="100px;" alt="Wolf"/><br /><sub><b>Wolf</b></sub></a><br /><a href="#infra-raizo07" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/jedstroke"><img src="https://avatars.githubusercontent.com/u/86930056?v=4?s=100" width="100px;" alt="Jed"/><br /><sub><b>Jed</b></sub></a><br /><a href="#code-jedstroke" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/EjembiEmmanuel"><img src="https://avatars.githubusercontent.com/u/83036156?v=4?s=100" width="100px;" alt="Emmaunuel Ejembi"/><br /><sub><b>Emmaunuel Ejembi</b></sub></a><br /><a href="#code-EjembiEmmanuel" title="Code">💻</a> <a href="#doc-EjembiEmmanuel" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kateberryd"><img src="https://avatars.githubusercontent.com/u/35270183?v=4?s=100" width="100px;" alt="Catherine Jonathan"/><br /><sub><b>Catherine Jonathan</b></sub></a><br /><a href="#code-kateberryd" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/NeelkanthTandel"><img src="https://avatars.githubusercontent.com/u/68822066?v=4?s=100" width="100px;" alt="Neelkanth Tandel"/><br /><sub><b>Neelkanth Tandel</b></sub></a><br /><a href="#review-NeelkanthTandel" title="Reviewed Pull Requests">👀</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ugo-X"><img src="https://avatars.githubusercontent.com/u/133219527?v=4?s=100" width="100px;" alt="Ugonna Paul Dike"/><br /><sub><b>Ugonna Paul Dike</b></sub></a><br /><a href="#code-Ugo-X" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://fishonsnote.medium.com/"><img src="https://avatars.githubusercontent.com/u/43862685?v=4?s=100" width="100px;" alt="Fishon Amos"/><br /><sub><b>Fishon Amos</b></sub></a><br /><a href="#code-fishonamos" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ooochoche"><img src="https://avatars.githubusercontent.com/u/101812348?v=4?s=100" width="100px;" alt="Benedict Ejembi"/><br /><sub><b>Benedict Ejembi</b></sub></a><br /><a href="#infra-ooochoche" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Jemiiah"><img src="https://avatars.githubusercontent.com/u/160767568?v=4?s=100" width="100px;" alt="Jemiiah"/><br /><sub><b>Jemiiah</b></sub></a><br /><a href="#code-Jemiiah" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Dprof-in-tech"><img src="https://avatars.githubusercontent.com/u/116242877?v=4?s=100" width="100px;" alt="Isaac Onyemaechi Ugwu"/><br /><sub><b>Isaac Onyemaechi Ugwu</b></sub></a><br /><a href="#code-Dprof-in-tech" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Ayoazeez26"><img src="https://avatars.githubusercontent.com/u/44169294?v=4?s=100" width="100px;" alt="Abdulhakeem Abdulazeez Ayodeji"/><br /><sub><b>Abdulhakeem Abdulazeez Ayodeji</b></sub></a><br /><a href="#code-Ayoazeez26" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Gift-Naomi"><img src="https://avatars.githubusercontent.com/u/149405096?v=4?s=100" width="100px;" alt="Mystic"/><br /><sub><b>Mystic</b></sub></a><br /><a href="#code-Gift-Naomi" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://nnaji-benjamin-portfolio.vercel.app/"><img src="https://avatars.githubusercontent.com/u/60315147?v=4?s=100" width="100px;" alt="Nnaji Benjamin"/><br /><sub><b>Nnaji Benjamin</b></sub></a><br /><a href="#code-Benjtalkshow" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/martinvibes"><img src="https://avatars.githubusercontent.com/u/127976766?v=4?s=100" width="100px;" alt="martin machiebe"/><br /><sub><b>martin machiebe</b></sub></a><br /><a href="#code-martinvibes" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Gerson2102"><img src="https://avatars.githubusercontent.com/u/71728860?v=4?s=100" width="100px;" alt="Gerson"/><br /><sub><b>Gerson</b></sub></a><br /><a href="#code-Gerson2102" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://ikem.dev"><img src="https://avatars.githubusercontent.com/u/91676649?v=4?s=100" width="100px;" alt="Ikem"/><br /><sub><b>Ikem</b></sub></a><br /><a href="#code-ikemHood" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

[![All Contributors](https://img.shields.io/github/all-contributors/akiraonstarknet/starkfarm-client?color=ee8449&style=flat-square)](#contributors)
