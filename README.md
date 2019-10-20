# Discord Music Bot
> A discord bot that plays music from YouTube.

This is a discord bot that takes any music (or video) stream from YouTube and plays it in a discord voice channel.

This bot allows for:
* YouTube playlist playback
* Global volume control
* Lockdown mode for trusted users

## How to use
Run `npm install` to install all the dependencies.
Create a `config.json` file that contains `prefix, token and apiKey` values.
* `prefix` is the character required to issue a command
* `token` is the Discord bot token
* `apiKey` is the YouTube API Key

Example config.json:
```json
{
    "prefix": "/",
    "token": "Discord-Bot-Token-Here",
    "apiKey": "YouTube-Api-Key-Here"
}
```
