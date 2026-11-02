import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ApiError } from '../../api/client';
import { classColorSchema, type ClassColor } from '../../domain/classType';
import { useTheme } from '../../theme';
import { ClassCard } from '../classes/ClassCard';
import { ExerciseImage, ImageAttribution } from '../exercise';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingSkeleton,
  Text,
} from '../ui';

/**
 * TEMPORARY design-system showcase, to review components on a real device
 * (light/dark mode, icons, touch targets). Removed in T5.1 with the real screens.
 */

const CLASS_NAMES: Record<ClassColor, string> = {
  accentOrange: 'Funcional',
  accentBlue: 'Spinning',
  accentGreen: 'Yoga',
  accentPurple: 'Pilates',
  accentPink: 'Zumba',
  accentTeal: 'HIIT',
};

const WITH_IMAGE = {
  name: 'Aducción de Cadera en Máquina',
  muscleGroup: 'legs',
  imageUrl: 'https://wger.de/media/exercise-images/12/4a42cc6f-648d-40cc-a72a-c49dd47e1667.webp',
  imageAuthor: 'Comunidad de wger',
  imageLicense: 'CC-BY-SA 4',
} as const;

const WITHOUT_IMAGE = { name: 'Caminata del Oso', muscleGroup: 'chest', imageUrl: null } as const;

const OFFLINE = new ApiError({ kind: 'network', url: 'http://demo', status: null });

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="title">{title}</Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  const { spacing } = useTheme();
  return <View style={[styles.row, { gap: spacing.sm }]}>{children}</View>;
}

export function Showcase() {
  const { colors, spacing, scheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [presses, setPresses] = useState(0);

  const emailError = email !== '' && !EMAIL.test(email) ? 'Ingresá un email válido' : undefined;
  const icon = (name: 'heart-outline' | 'close', color = colors.text) => (
    <MaterialCommunityIcons name={name} size={24} color={color} />
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.xl }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text variant="display">Componentes</Text>
        <Text color="textMuted">
          Pantalla temporal para revisar el design system. Modo actual:{' '}
          {scheme === 'dark' ? 'oscuro' : 'claro'} (cambialo en el celular).
        </Text>
      </View>

      <Section title="Texto">
        <Text variant="subtitle">Subtítulo</Text>
        <Text>Cuerpo de texto, 16 px.</Text>
        <Text variant="bodyStrong">Cuerpo destacado</Text>
        <Text variant="label">Etiqueta</Text>
        <Text variant="caption" color="textMuted">
          Texto chico secundario
        </Text>
      </Section>

      <Section title="Botones">
        <Button label="Reservar" onPress={() => setPresses((n) => n + 1)} />
        <Text variant="caption" color="textMuted">
          Toques: {presses}
        </Text>
        <Button
          label="Probar loading"
          variant="secondary"
          loading={loading}
          onPress={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 2000);
          }}
        />
        <Button label="Cancelar reserva" variant="danger" onPress={() => undefined} />
        <Button label="Ver detalle" variant="ghost" onPress={() => undefined} />
        <Button label="Deshabilitado" disabled onPress={() => undefined} />
        <Row>
          <IconButton
            icon={icon('heart-outline', colors.primary)}
            accessibilityLabel="Favorito"
            onPress={() => undefined}
          />
          <IconButton icon={icon('close')} accessibilityLabel="Cerrar" onPress={() => undefined} />
        </Row>
      </Section>

      <Section title="Badges">
        <Row>
          <Badge label="Neutral" />
          <Badge label="Reservada" tone="primary" />
          <Badge label="Activa" tone="success" />
          <Badge label="Por vencer" tone="warning" />
          <Badge label="Vencida" tone="danger" />
        </Row>
        <Row>
          {classColorSchema.options.map((color) => (
            <Badge key={color} label={CLASS_NAMES[color]} tone={color} />
          ))}
        </Row>
      </Section>

      <Section title="Tarjetas">
        <Card>
          <Text variant="subtitle">Tarjeta estática</Text>
          <Text color="textMuted">Superficie con borde y sombra.</Text>
        </Card>
        <Card onPress={() => setPresses((n) => n + 1)} accessibilityLabel="Tarjeta tocable">
          <Text variant="subtitle">Tarjeta tocable</Text>
          <Text color="textMuted">Tocala: cambia el fondo al presionar.</Text>
        </Card>
      </Section>

      <Section title="Campos">
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          hint="Escribí algo que no sea un email para ver el error"
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input label="Deshabilitado" value="No editable" editable={false} />
      </Section>

      <Section title="Imagen de ejercicio">
        <ExerciseImage exercise={WITH_IMAGE} size="large" />
        <ImageAttribution author={WITH_IMAGE.imageAuthor} license={WITH_IMAGE.imageLicense} />
        <Row>
          <ExerciseImage exercise={WITHOUT_IMAGE} />
          <ExerciseImage exercise={WITHOUT_IMAGE} size="small" />
        </Row>
      </Section>

      <Section title="Clases">
        <ClassCards />
      </Section>

      <Section title="Estados">
        <Card>
          <LoadingSkeleton rows={2} />
        </Card>
        <Card>
          <ErrorState error={OFFLINE} onRetry={() => undefined} />
        </Card>
        <Card>
          <EmptyState
            title="No tenés reservas"
            message="Reservá una clase desde la agenda."
            action={{ label: 'Ver clases', onPress: () => undefined }}
          />
        </Card>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
});

const DEMO_TYPE = {
  id: 'demo-spinning',
  name: 'Ciclismo indoor',
  description: '',
  durationMinutes: 45,
  intensity: 'high',
  color: 'accentOrange',
} as const;
const DEMO_TRAINER = { id: 'demo-t', firstName: 'Camila', lastName: 'Rodríguez', avatarUrl: null };

/** One ClassCard per state: available, last spots, full, booked and started. */
function ClassCards() {
  const { spacing } = useTheme();
  const [now] = useState(() => new Date());
  const inHours = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();
  const cards = [
    { id: 'a', startsAt: inHours(3), bookedCount: 6, booked: false },
    { id: 'b', startsAt: inHours(4), bookedCount: 10, booked: false },
    { id: 'c', startsAt: inHours(5), bookedCount: 12, booked: false },
    { id: 'd', startsAt: inHours(6), bookedCount: 12, booked: true },
    { id: 'e', startsAt: inHours(-0.25), bookedCount: 9, booked: false },
  ];
  return (
    <View style={{ gap: spacing.sm }}>
      {cards.map((c) => (
        <ClassCard
          key={c.id}
          session={{
            id: c.id,
            classTypeId: DEMO_TYPE.id,
            trainerId: DEMO_TRAINER.id,
            startsAt: c.startsAt,
            capacity: 12,
            bookedCount: c.bookedCount,
          }}
          classType={DEMO_TYPE}
          trainer={DEMO_TRAINER}
          booked={c.booked}
          now={now}
          onPress={() => undefined}
        />
      ))}
    </View>
  );
}
