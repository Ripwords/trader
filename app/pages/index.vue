<template>
  <div>
    <SingleTicker
      :options="{
        symbol: 'NVDA',
        width: 350,
        isTransparent: false,
        colorTheme: 'dark',
        locale: 'en',
      }"
    />
    <UiButton>Click me</UiButton>
  </div>
</template>
