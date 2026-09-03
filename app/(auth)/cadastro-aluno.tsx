import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from '../../components';
import { supabase } from '../../services/supabase';
import { listarEscolas } from '../../services/escolas';

const schema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  genero: z.enum(['M','F']),
  senha: z.string().min(6, 'Mínimo 6'),
  confirmarSenha: z.string().min(6, 'Confirma'),
}).refine(d => d.senha===d.confirmarSenha, { message: 'Senhas não coincidem', path: ['confirmarSenha'] });
type FormData = z.infer<typeof schema>;

export default function CadastroAluno() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [escolas, setEscolas] = useState<{id:string;nome:string}[]>([]);
  const [escolaId, setEscolaId] = useState('');
  const [visivel, setVisivel] = useState(false);
  const { control, handleSubmit, setValue, watch } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { nome:'', email:'', genero:'M', senha:'', confirmarSenha:'' } });
  const genero = watch('genero');
  useEffect(() => { listarEscolas().then(d=>setEscolas(d??[])).catch(()=>{}); }, []);
  const onSubmit = async (data: FormData) => {
    if (!escolaId) { Alert.alert('Escolhe a escola'); return; }
    setLoading(true); setErro('');
    const { data: authData, error } = await supabase.auth.signUp({ email: data.email, password: data.senha, options: { data: { papeis: ['aluno'], nome: data.nome } } });
    if (error) { setLoading(false); const m = error.message.includes('already') ? 'Email já existe. Faz login.' : error.message; setErro(m); Alert.alert('Erro', m); return; }
    if (!authData.user) { setLoading(false); const m='Falha ao criar conta. Desliga Confirm email no Supabase.'; setErro(m); Alert.alert('Erro', m); return; }
    if (!authData.session) { setLoading(false); const m='Conta criada mas confirma email está ligado. Desliga em Supabase Auth.'; setErro(m); Alert.alert('Confirma email', m); return; }
    try {
      const { error: rpcErr } = await supabase.rpc('registar_aluno', { p_escola_id: escolaId, p_nome: data.nome, p_email: data.email, p_genero: data.genero });
      if (rpcErr) throw rpcErr;
      await AsyncStorage.setItem('kulonga_perfil','aluno');
      await AsyncStorage.setItem('kulonga_papeis', JSON.stringify(['aluno']));
      await AsyncStorage.setItem('kulonga_papel_activo','aluno');
      await AsyncStorage.setItem('kulonga_sessao_activa','true');
      await AsyncStorage.setItem('kulonga_onboarding_feito','true');
      setLoading(false);
      router.replace('/(aluno)' as any);
    } catch (e:any) { setLoading(false); const m=e.message; setErro(m); Alert.alert('Erro', m); }
  };
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#6B7280" /></TouchableOpacity>
          <Text style={s.logo}>KULONGA</Text><Text style={s.titulo}>Registar Aluno</Text><Text style={s.sub}>Cria a tua conta de aluno</Text>
          <View style={s.form}>
            <TouchableOpacity style={s.select} onPress={()=>setVisivel(!visivel)}><Ionicons name="school-outline" size={18} color="#6B7280" /><Text style={[s.selectTxt, !escolaId && {color:'#9CA3AF'}]}>{escolas.find(e=>e.id===escolaId)?.nome || 'Selecciona a escola'}</Text><Ionicons name={visivel?'chevron-up':'chevron-down'} size={18} color="#6B7280" /></TouchableOpacity>
            {visivel && <View style={s.drop}>{escolas.map(e=><TouchableOpacity key={e.id} style={s.dropItem} onPress={()=>{setEscolaId(e.id); setVisivel(false);}}><Text>{e.nome}</Text></TouchableOpacity>)}</View>}
            <Controller control={control} name="nome" render={({field, fieldState})=> <Input label="Nome completo" placeholder="Ex: João Silva" valor={field.value} onMudar={field.onChange} icone="person-outline" erro={fieldState.error?.message} />} />
            <Controller control={control} name="email" render={({field, fieldState})=> <Input label="Email" placeholder="aluno@escola.ao" valor={field.value} onMudar={field.onChange} icone="mail-outline" teclado="email-address" erro={fieldState.error?.message} />} />
            <Text style={s.label}>Género</Text><View style={s.generoRow}>
              <TouchableOpacity style={[s.genBtn, genero==='M' && s.genAct]} onPress={()=>setValue('genero','M')}><Text style={[s.genTxt, genero==='M' && s.genActTxt]}>M</Text></TouchableOpacity>
              <TouchableOpacity style={[s.genBtn, genero==='F' && s.genAct]} onPress={()=>setValue('genero','F')}><Text style={[s.genTxt, genero==='F' && s.genActTxt]}>F</Text></TouchableOpacity>
            </View>
            <Controller control={control} name="senha" render={({field, fieldState})=> <Input label="Senha" placeholder="Mínimo 6" valor={field.value} onMudar={field.onChange} seguro icone="lock-closed-outline" erro={fieldState.error?.message} />} />
            <Controller control={control} name="confirmarSenha" render={({field, fieldState})=> <Input label="Confirmar" placeholder="Repete senha" valor={field.value} onMudar={field.onChange} seguro icone="lock-closed-outline" erro={fieldState.error?.message} />} />
            {erro ? <Text style={{ color: '#DC2626', textAlign: 'center', marginBottom: 12 }}>{erro}</Text> : null}
            <Button titulo="Registar" onPress={handleSubmit(onSubmit) as any} variante="primario" tamanho="grande" carregando={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'}, scroll:{padding:20,paddingBottom:40}, logo:{color:'#C8511B',fontWeight:'800',fontSize:22, marginTop:8}, titulo:{fontSize:22,fontWeight:'800',marginTop:12}, sub:{color:'#6B7280',textAlign:'center',marginTop:8},
  form:{width:'100%',marginTop:24}, select:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#D1D5DB',borderRadius:8,padding:12,backgroundColor:'#fff',gap:8, marginBottom:12}, selectTxt:{flex:1,fontSize:14}, drop:{borderWidth:1,borderColor:'#D1D5DB',borderRadius:8,backgroundColor:'#fff',maxHeight:150,marginBottom:12}, dropItem:{padding:12,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},
  label:{fontWeight:'600',marginBottom:6}, generoRow:{flexDirection:'row',gap:8,marginBottom:12}, genBtn:{flex:1,borderWidth:1,borderColor:'#D1D5DB',borderRadius:8,padding:12,alignItems:'center'}, genAct:{backgroundColor:'#1D5C8A',borderColor:'#1D5C8A'}, genTxt:{color:'#6B7280'}, genActTxt:{color:'#fff'},
});
