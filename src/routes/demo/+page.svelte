<script lang="ts">
	import Topbar from '#lib/components/Topbar.svelte';
</script>

<svelte:head><title>Демо — Станція «Пітон-1»</title></svelte:head>

<Topbar />
<main>
	<section class="hero login">
		<div class="intro-card">
			<h1>Тривога на орбіті</h1>
			<p>Після сонячної бурі станція «Пітон-1» залишилася без живлення. Бортовий комп’ютер уцілів, але тепер розуміє лише мову Python.</p>
			<p>Це демо: ти увійдеш як тимчасовий учень. Прогрес зникне через добу.</p>
			<form method="POST" class="intro-form">
				<button class="btn amber" type="submit">Спробувати як учень</button>
			</form>
		</div>
	</section>
</main>
