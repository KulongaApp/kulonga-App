import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, ProfessorContactCard } from '../../components';
import { alunoMock } from '../../mocks/aluno';

export default function ContactosEncarregado() {
  const router = useRouter();
  const aluno = alunoMock;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity accessibilityLabel="Voltar" onPress={() => router.push('/(encarregado)/painel')}>
            <Ionicons name="arrow-back" size={22} color="#1D5C8A" />
          </TouchableOpacity>
          <Text style={styles.title}>Professores e Contactos</Text>
          <Text style={styles.subtitle}>Turma {aluno.turma} · {aluno.anoLetivo}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Coordenador de Turma</Text>
          <ProfessorContactCard
            nome={aluno.coordenador.nome}
            telefone={aluno.coordenador.telefone}
            disciplina="Coordenador"
            coordenador
            destaque
          />
          <Card estilo={styles.infoCard} sombra>
            <Text style={styles.infoText}>
              O coordenador é o teu primeiro contacto para assuntos gerais da turma.
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Professores por disciplina</Text>
          {aluno.disciplinas.map((disciplina) => (
            <ProfessorContactCard
              key={disciplina.id}
              nome={disciplina.professor.nome}
              telefone={disciplina.professor.telefone}
              disciplina={disciplina.nome}
              coordenador={false}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ Informação útil</Text>
          <View style={styles.usefulCard}>
            <Text style={styles.usefulText}>
              Podes ligar directamente carregando no botão de telefone. Os horários de contacto são definidos por cada escola.
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          Os contactos reais aparecem quando a escola activar o Kulonga.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { color: '#1D5C8A', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: '#6B7280', fontSize: 14 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: '#111827' },
  infoCard: { marginTop: 12, backgroundColor: '#EFF6FF' },
  infoText: { color: '#1E3A8A', lineHeight: 20 },
  usefulCard: { backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12 },
  usefulText: { color: '#1E3A8A', lineHeight: 20 },
  footerText: { color: '#6B7280', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
