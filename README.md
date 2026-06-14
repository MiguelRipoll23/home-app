# home-app

An alternative for Windows or Linux to manage your Matter accessories with an experience similar to the Apple Home app.

## Features

- Pair and control Matter accessories
- Organize accessories into rooms with custom names, reorder them, and mark favorites for quick access
- Create and activate scenes to control multiple devices at once
- Customize the experience with dark/light themes
- Import and export your configuration

## Screenshots

![Home View](screenshots/home-view.png)
![Accessory Control UI](screenshots/accessory-control-ui.png)

## Supported Device Types

- **Lights** — White-only and colored bulbs, brightness and color control
- **Plugs** — On/off control with cumulative energy monitoring

## Pairing a Device

### New Accessories

Tap the **+** button and scan the QR code on your accessory, or use **Use Setup Code** to enter the pairing code.

### Already-Paired Accessories

If your accessory is already paired with another Matter controller (Apple Home, Google Home, SmartThings, etc.), you can share it without resetting:

1. Open the controller app your accessory is currently paired with
2. Find the accessory's settings and look for **Turn On Pairing Mode**, **Pairing Mode**, or **Sharing Mode**
3. A setup code (manual pairing code) will be displayed
4. In home-app, tap the **+** button, then **Use Setup Code**, and enter the code

The accessory will be added to home-app while remaining paired with your other controller as well.

## Credits

- Default background image by [Unsplash](https://unsplash.com/photos/1616486338812-3dadae4b4ace)
