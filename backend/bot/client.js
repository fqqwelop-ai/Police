const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Officer = require('../models/Officer');
const Rank = require('../models/Rank');

const ADMIN_ROLE_IDS = (process.env.ADMIN_ROLE_IDS || '').split(',').map(s => s.trim()).filter(Boolean);

const commands = [
  new SlashCommandBuilder()
    .setName('نقاط')
    .setDescription('إدارة نقاط الضباط')
    .addSubcommand(sub => sub.setName('إضافة')
      .setDescription('إضافة نقاط لضابط')
      .addUserOption(opt => opt.setName('العضو').setDescription('الضابط').setRequired(true))
      .addIntegerOption(opt => opt.setName('العدد').setDescription('عدد النقاط').setRequired(true))
      .addStringOption(opt => opt.setName('السبب').setDescription('سبب إضافة النقاط')))
    .addSubcommand(sub => sub.setName('خصم')
      .setDescription('خصم نقاط من ضابط')
      .addUserOption(opt => opt.setName('العضو').setDescription('الضابط').setRequired(true))
      .addIntegerOption(opt => opt.setName('العدد').setDescription('عدد النقاط').setRequired(true))
      .addStringOption(opt => opt.setName('السبب').setDescription('سبب الخصم')))
    .addSubcommand(sub => sub.setName('عرض')
      .setDescription('عرض نقاط ضابط')
      .addUserOption(opt => opt.setName('العضو').setDescription('الضابط').setRequired(true))),

  new SlashCommandBuilder()
    .setName('رتبة')
    .setDescription('إدارة رتب الضباط')
    .addSubcommand(sub => sub.setName('تعيين')
      .setDescription('تعيين رتبة لضابط')
      .addUserOption(opt => opt.setName('العضو').setDescription('الضابط').setRequired(true))
      .addStringOption(opt => opt.setName('الرتبة').setDescription('اسم الرتبة').setRequired(true))),

  new SlashCommandBuilder()
    .setName('ملفي')
    .setDescription('عرض ملفك الشخصي كضابط'),
].map(c => c.toJSON());

function isAdmin(member) {
  if (!member) return false;
  if (member.permissions?.has?.(PermissionFlagsBits.Administrator)) return true;
  return member.roles.cache.some(r => ADMIN_ROLE_IDS.includes(r.id));
}

async function getOrCreateOfficer(user) {
  let officer = await Officer.findOne({ discordId: user.id });
  if (!officer) {
    const lowestRank = await Rank.findOne().sort({ level: -1 });
    officer = await Officer.create({
      discordId: user.id,
      username: user.username,
      avatar: user.avatarURL?.() || null,
      rank: lowestRank?._id || null,
    });
  }
  return officer;
}

function startBot() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

  client.once('ready', async () => {
    console.log(`🚓 البوت متصل باسم ${client.user.tag}`);
    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
      if (process.env.DISCORD_GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID),
          { body: commands }
        );
      } else {
        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
      }
      console.log('✅ تم تسجيل أوامر السلاش');
    } catch (err) {
      console.error('❌ فشل تسجيل الأوامر:', err);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      if (interaction.commandName === 'نقاط') {
        const sub = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('العضو');
        const officer = await getOrCreateOfficer(targetUser);

        if (sub === 'عرض') {
          await officer.populate('rank');
          const embed = new EmbedBuilder()
            .setTitle(`نقاط ${targetUser.username}`)
            .setColor(officer.rank?.color || '#D4A24C')
            .addFields(
              { name: 'الرتبة', value: officer.rank?.name || 'بدون رتبة', inline: true },
              { name: 'النقاط', value: String(officer.points), inline: true },
            );
          return interaction.reply({ embeds: [embed] });
        }

        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: '❌ ما عندك صلاحية تستخدم هذا الأمر.', ephemeral: true });
        }

        const amount = interaction.options.getInteger('العدد');
        const reason = interaction.options.getString('السبب') || 'بدون سبب محدد';
        const delta = sub === 'خصم' ? -amount : amount;

        officer.points = Math.max(0, officer.points + delta);
        await officer.save();

        const embed = new EmbedBuilder()
          .setTitle(sub === 'خصم' ? '➖ تم خصم نقاط' : '➕ تم إضافة نقاط')
          .setColor(sub === 'خصم' ? '#C0392B' : '#2ECC71')
          .addFields(
            { name: 'الضابط', value: `<@${targetUser.id}>`, inline: true },
            { name: 'العدد', value: String(amount), inline: true },
            { name: 'الرصيد الحالي', value: String(officer.points), inline: true },
            { name: 'السبب', value: reason },
            { name: 'بواسطة', value: `<@${interaction.user.id}>` },
          );
        await interaction.reply({ embeds: [embed] });

        // إشعار خاص للضابط
        targetUser.send({ embeds: [embed] }).catch(() => {});
        return;
      }

      if (interaction.commandName === 'رتبة') {
        if (!isAdmin(interaction.member)) {
          return interaction.reply({ content: '❌ ما عندك صلاحية تستخدم هذا الأمر.', ephemeral: true });
        }
        const targetUser = interaction.options.getUser('العضو');
        const rankName = interaction.options.getString('الرتبة');

        const rank = await Rank.findOne({ name: rankName });
        if (!rank) return interaction.reply({ content: `❌ ما فيه رتبة باسم "${rankName}".`, ephemeral: true });

        const officer = await getOrCreateOfficer(targetUser);
        officer.rank = rank._id;
        await officer.save();

        // مزامنة الرول في ديسكورد إذا محدد
        if (rank.discordRoleId) {
          const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
          if (member) await member.roles.add(rank.discordRoleId).catch(() => {});
        }

        const embed = new EmbedBuilder()
          .setTitle('🎖️ تم تحديث الرتبة')
          .setColor(rank.color)
          .addFields(
            { name: 'الضابط', value: `<@${targetUser.id}>`, inline: true },
            { name: 'الرتبة الجديدة', value: rank.name, inline: true },
          );
        return interaction.reply({ embeds: [embed] });
      }

      if (interaction.commandName === 'ملفي') {
        const officer = await getOrCreateOfficer(interaction.user);
        await officer.populate('rank');
        const embed = new EmbedBuilder()
          .setTitle(`ملف الضابط: ${interaction.user.username}`)
          .setColor(officer.rank?.color || '#D4A24C')
          .addFields(
            { name: 'الرتبة', value: officer.rank?.name || 'بدون رتبة', inline: true },
            { name: 'النقاط', value: String(officer.points), inline: true },
            { name: 'الحالة', value: officer.status, inline: true },
          );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } catch (err) {
      console.error('خطأ في تنفيذ الأمر:', err);
      if (!interaction.replied) {
        interaction.reply({ content: '⚠️ صار خطأ أثناء تنفيذ الأمر.', ephemeral: true }).catch(() => {});
      }
    }
  });

  client.login(process.env.DISCORD_BOT_TOKEN);
  return client;
}

module.exports = { startBot };
