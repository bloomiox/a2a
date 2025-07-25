import './App.css'
import { useEffect, useState } from 'react'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"
import { ensureSchemaUpToDate } from '@/utils/schemaManager'
import { toast } from "@/components/ui/use-toast"
import initializeLogging from '@/services/LoggingInitializer'
import { AppSettings } from '@/api/entities'
import AppSettingsProvider from '@/contexts/AppSettingsContext'

function App() {
  const [schemaChecked, setSchemaChecked] = useState(false);
  
  useEffect(() => {
    // Initialize logging system
    initializeLogging();
    
    // Load and apply app settings
    const loadAppSettings = async () => {
      try {
        const settings = await AppSettings.get();
        if (settings) {
          AppSettings.apply(settings);
          console.log('App settings applied');
        }
      } catch (error) {
        console.error('Error loading app settings:', error);
      }
    };
    
    // Check and update the schema when the application starts
    const checkSchema = async () => {
      try {
        const isSchemaUpToDate = await ensureSchemaUpToDate();
        
        if (isSchemaUpToDate) {
          console.log('Database schema is up to date');
        } else {
          console.warn('Failed to update database schema');
          toast({
            title: "Schema Update Warning",
            description: "Some features may not work correctly due to database schema issues.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error checking schema:', error);
      } finally {
        setSchemaChecked(true);
      }
    };
    
    loadAppSettings();
    checkSchema();
  }, []);
  
  return (
    <AppSettingsProvider>
      <Pages />
      <Toaster />
    </AppSettingsProvider>
  )
}

export default App 