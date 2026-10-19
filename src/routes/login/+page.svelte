<script lang="ts">
	import Topbar from '#lib/components/Topbar.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Вхід — Станція «Пітон-1»</title></svelte:head>

<Topbar />
<main>
	<section class="hero login">
		<div class="intro-card">
			<h1>Тривога на орбіті</h1>
			<p>Після сонячної бурі станція «Пітон-1» залишилася без живлення. Бортовий комп’ютер уцілів, але тепер розуміє лише мову Python.</p>
			{#if !data.cls}
				<p>Ти — черговий кадет. Щоб заступити на чергування, введи код свого класу.</p>
				<form method="GET" class="intro-form">
					<label for="code">Код класу — його дасть учитель</label>
					<input id="code" name="code" defaultValue={data.code} required maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" />
					<button class="btn amber" type="submit">Далі</button>
				</form>
				{#if data.code}<p class="login-err">Клас із кодом «{data.code}» не знайдено. Перевір код.</p>{/if}
			{:else}
				<!-- код класу лишається в адресі дії: після помилки сторінка показує той самий клас -->
				<p class="login-class">Клас <b>{data.cls.name}</b> · <a href="/login">інший код</a></p>
				<div class="login-grid">
					{#if data.roster.length}
						<form method="POST" action="?code={data.cls.code}&/login" class="login-box">
							<h2>Я вже на станції</h2>
							<input type="hidden" name="code" value={data.cls.code} />
							<fieldset class="roster">
								<legend>Обери своє ім’я</legend>
								{#each data.roster as s (s.id)}
									<label><input type="radio" name="student" value={s.id} required checked={form?.student === s.id} />{s.name}</label>
								{/each}
							</fieldset>
							<label for="pin">PIN-код</label>
							<input id="pin" name="pin" type="password" inputmode="numeric" pattern={'\\d{4}'} maxlength="4" required autocomplete="off" />
							{#if form?.login}<p class="login-err" role="alert">{form.login}</p>{/if}
							<button class="btn amber" type="submit">Увійти</button>
						</form>
					{/if}
					<form method="POST" action="?code={data.cls.code}&/register" class="login-box">
						<h2>Я тут уперше</h2>
						<input type="hidden" name="code" value={data.cls.code} />
						<label for="name">Ім’я та перша літера прізвища</label>
						<input id="name" name="name" defaultValue={form?.name ?? ''} required minlength="2" maxlength="40" autocomplete="off" placeholder="наприклад, Оля К." />
						<label for="pin1">Придумай PIN — 4 цифри</label>
						<input id="pin1" name="pin" type="password" inputmode="numeric" pattern={'\\d{4}'} maxlength="4" required autocomplete="new-password" />
						<label for="pin2">Повтори PIN</label>
						<input id="pin2" name="pin2" type="password" inputmode="numeric" pattern={'\\d{4}'} maxlength="4" required autocomplete="new-password" />
						{#if form?.register}<p class="login-err" role="alert">{form.register}</p>{/if}
						<button class="btn amber" type="submit">Заступити на чергування</button>
					</form>
				</div>
				<p class="login-note">Запам’ятай свій PIN: з ним ти продовжиш гру з будь-якого комп’ютера. Якщо забудеш — скажи вчителю.</p>
			{/if}
		</div>
	</section>
</main>
